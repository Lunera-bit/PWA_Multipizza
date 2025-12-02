import {onRequest} from "firebase-functions/v2/https";
import axios from "axios";
import * as admin from "firebase-admin";

admin.initializeApp();

const OLLAMA_URL = "http://localhost:11434/api/generate";
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
      context += "**PRODUCTOS DISPONIBLES:**\n";
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        const productInfo = {
          id: doc.id,
          nombre: data.nombre,
          precio: data.precio,
          descripcion: data.descripcion,
          categoria: data.categoria,
          tags: data.tags || [],
        };
        context += `- ${JSON.stringify(productInfo)}\n`;
      });

      const pedidosSnapshot = await db.collection("pedidos").get();
      context += "\n**PEDIDOS RECIENTES:**\n";
      pedidosSnapshot.forEach(doc => {
        const data = doc.data();
        const items = data.items || [];
        const itemsInfo = items.map((item: any) => ({
          title: item.title,
          qty: item.qty,
        }));
        const userInfo = items.map((user: any) => ({
          name: user.name,
        }));
        const pedidoInfo = {
          status: data.status,
          total: data.total,
          items: itemsInfo,
          user: userInfo,
        };
        context += `- ${JSON.stringify(pedidoInfo)}\n`;
      });

      const response = await axios.post(OLLAMA_URL, {
        model: "llama3",
        prompt: `${context}\n\nINSTRUCCIONES IMPORTANTES:
        - Siempre muestra los precios en soles (S/. o soles peruanos)
        - Formato de precio: S/. [número] (ejemplo: S/. 7.00)
        - No menciones IDs en tu respuesta
        - Sé amable y útil con el usuario
        - Responde en español
        - Responde de forma concisa,breve y clara

        Usuario pregunta: ${message}`,
        stream: false,
      }, {
        timeout: 120000,
      });

      const reply = response.data?.response || "No response";
      res.json({reply});
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({error: "Failed to process"});
    }
  }
);
