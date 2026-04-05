import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Load Firebase Config
  let db: admin.firestore.Firestore;
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  
  const initializeDb = async () => {
    let currentDb: admin.firestore.Firestore;
    let usingNamed = false;

    if (fs.existsSync(configPath)) {
      try {
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log("Initializing Firebase Admin with Project ID:", firebaseConfig.projectId);
        
        if (!admin.apps.length) {
          admin.initializeApp({
            projectId: firebaseConfig.projectId
          });
        }

        const dbId = firebaseConfig.firestoreDatabaseId;
        if (dbId && dbId !== "(default)") {
          console.log("Attempting to use named Firestore Database ID:", dbId);
          currentDb = admin.firestore(dbId);
          usingNamed = true;
        } else {
          console.log("Using default Firestore database");
          currentDb = admin.firestore();
        }
      } catch (error) {
        console.error("Error reading config or initializing admin:", error);
        if (!admin.apps.length) admin.initializeApp();
        currentDb = admin.firestore();
      }
    } else {
      console.log("No config file found, using default initialization");
      if (!admin.apps.length) admin.initializeApp();
      currentDb = admin.firestore();
    }

    // Test connection
    const testConnection = async (dbInstance: admin.firestore.Firestore, name: string) => {
      try {
        await dbInstance.collection('_health').doc('check').get();
        console.log(`Firestore connection test (${name}) successful`);
        return true;
      } catch (error: any) {
        console.error(`Firestore connection test (${name}) failed:`, error.message || error);
        return false;
      }
    };

    const isOk = await testConnection(currentDb, usingNamed ? "Named" : "Default");
    
    if (!isOk && usingNamed) {
      console.warn("Named database failed connection test, falling back to default database");
      const defaultDb = admin.firestore();
      const defaultOk = await testConnection(defaultDb, "Default Fallback");
      if (defaultOk) {
        return defaultDb;
      }
    }

    return currentDb;
  };

  db = await initializeDb();

  // Helper to check if error is NOT_FOUND
  const isNotFoundError = (err: any) => {
    const msg = String(err.message || err).toUpperCase();
    return err.code === 5 || err.status === 5 || msg.includes('NOT_FOUND') || msg.includes('NOT FOUND');
  };

  // Global error handler to ensure JSON responses
  const handleApiError = (res: express.Response, error: any, message: string) => {
    console.error(`${message}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      error: message, 
      details: errorMessage,
      isFirestoreError: errorMessage.includes('NOT_FOUND') || errorMessage.includes('permission-denied')
    });
  };

  // API: Generate License Key (Owner only)
  app.post("/api/generate-key", async (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET;
    const { secret, count = 1, durationDays = 30 } = req.body;

    if (!adminSecret || secret !== adminSecret) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const keys = [];
      for (let i = 0; i < count; i++) {
        const key = crypto.randomBytes(8).toString("hex").toUpperCase();
        try {
          await db.collection("licenseKeys").doc(key).set({
            key,
            isUsed: false,
            durationDays,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (innerError: any) {
          // If named database fails with NOT_FOUND, try default database
          if (isNotFoundError(innerError)) {
            console.warn("Named database not found, falling back to default for this operation");
            const defaultDb = admin.firestore();
            await defaultDb.collection("licenseKeys").doc(key).set({
              key,
              isUsed: false,
              durationDays,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Update global db reference for future calls
            db = defaultDb;
          } else {
            throw innerError;
          }
        }
        keys.push(key);
      }
      res.json({ keys });
    } catch (error) {
      handleApiError(res, error, "Failed to generate keys");
    }
  });

  // API: Redeem License Key
  app.post("/api/redeem-key", async (req, res) => {
    const { key, userId } = req.body;

    if (!key || !userId) {
      return res.status(400).json({ error: "Key and User ID are required" });
    }

    try {
      let keyRef = db.collection("licenseKeys").doc(key.toUpperCase());
      let keyDoc;
      
      try {
        keyDoc = await keyRef.get();
      } catch (innerError: any) {
        if (isNotFoundError(innerError)) {
          console.warn("Named database not found, falling back to default for redemption");
          const defaultDb = admin.firestore();
          keyRef = defaultDb.collection("licenseKeys").doc(key.toUpperCase());
          keyDoc = await keyRef.get();
          // Update global db reference
          db = defaultDb;
        } else {
          throw innerError;
        }
      }

      if (!keyDoc.exists) {
        return res.status(404).json({ error: "Invalid key" });
      }

      const keyData = keyDoc.data();
      if (keyData?.isUsed) {
        return res.status(400).json({ error: "Key already used" });
      }

      const durationDays = keyData?.durationDays || 30;
      const now = new Date();
      const proUntil = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Use the correct DB instance for the transaction
      const activeDb = keyRef.firestore;

      // Atomic update
      await activeDb.runTransaction(async (transaction) => {
        transaction.update(keyRef, {
          isUsed: true,
          usedBy: userId,
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const userRef = activeDb.collection("users").doc(userId);
        const userDoc = await transaction.get(userRef);
        
        let currentProUntil = null;
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.proUntil) {
            currentProUntil = userData.proUntil.toDate();
          }
        }

        // If user already has pro, extend it
        const baseDate = (currentProUntil && currentProUntil > now) ? currentProUntil : now;
        const newProUntil = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        transaction.set(userRef, {
          proUntil: admin.firestore.Timestamp.fromDate(newProUntil)
        }, { merge: true });
      });

      res.json({ success: true, proUntil: proUntil.toISOString() });
    } catch (error) {
      handleApiError(res, error, "Failed to redeem key");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
