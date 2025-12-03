import {onRequest} from "firebase-functions/v2/https";
import axios from "axios";
import * as admin from "firebase-admin";

admin.initializeApp();

const OLLAMA_URL = "http://localhost:11434/api/generate";
const PAYPAL_CLIENT_ID = "AVID1fQErsLxWjsfqy09zjgtbEBJDcZS6ejSlWsRqGJuiuDb-XhQsHLMh8-vT91wZoamyrnDh6t9sJWd";
const PAYPAL_SECRET = "ENXfFUPE4W87OLnE0JU70GXlJWfaPAZucS9uZCsiwRvKxYV7cAWpOZwYPxlOux1Z9opL69giULP95EQ5";
const PAYPAL_API = "https://api.sandbox.paypal.com";
const EXCHANGE_RATE = 3.4;
const db = admin.firestore();

export const chatbot = onRequest(
  {timeoutSeconds: 300},
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const message = req.body?.message;      
      if (!message) {
        res.status(400).json({error: "Missing message"});
        return;
      }

      let context = "Contexto del negocio:\n\n";

      const productsSnapshot = await db.collection("products").get();
      context += "PRODUCTOS DISPONIBLES:\n";
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        const productInfo = {
          id: doc.id,
          nombre: data.nombre,
          precio: data.precio,
          descripcion: data.descripcion,
          categoria: data.categoria,
        };
        context += `- ${JSON.stringify(productInfo)}\n`;
      });

      const promosSnapshot = await db.collection("promo").get();
      context += "\nPROMOCIONES DISPONIBLES:\n";
      promosSnapshot.forEach(doc => {
        const data = doc.data();
        const promoInfo = {
          id: doc.id,
          nombre: data.nombre,
          precio: data.precio,
          descripcion: data.descripcion,
        };
        context += `- ${JSON.stringify(promoInfo)}\n`;
      });

      const response = await axios.post(OLLAMA_URL, {
        model: "llama3",
        prompt: `${context}\nUsuario pregunta: ${message}`,
        stream: false,
      }, {
        timeout: 120000,
      });

      const reply = response.data?.response || "No response";
      res.json({reply});
    } catch (error) {
      res.status(500).json({error: "Failed to process"});
    }
  }
);

export const paypalCreateOrder = onRequest(
  {timeoutSeconds: 300, cors: true},
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      let {amount, description} = req.body;

      if (!amount || !description) {
        res.status(400).json({error: "Missing amount or description"});
        return;
      }

      const amountInUSD = (amount / EXCHANGE_RATE).toFixed(2);

      if (!PAYPAL_SECRET || PAYPAL_SECRET.length === 0) {
        res.status(500).json({error: "PayPal Secret not configured"});
        return;
      }

      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');

      const orderData = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amountInUSD
            },
            description: description
          }
        ]
      };

      const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, orderData, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({error: "Failed to create order", details: error.response?.data});
    }
  }
);

export const paypalCaptureOrder = onRequest(
  {timeoutSeconds: 300, cors: true},
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const {orderId} = req.body;

      if (!orderId) {
        res.status(400).json({error: "Missing orderId"});
        return;
      }

      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');

      const response = await axios.post(
        `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({error: "Failed to capture order", details: error.response?.data});
    }
  }
);
