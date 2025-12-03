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
      const userName = req.body?.userName || 'Usuario';
      
      if (!message) {
        res.status(400).json({error: "Missing message"});
        return;
      }

      let context = "Contexto del negocio:\n\n";

      // Productos
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

      // Promociones
      const promosSnapshot = await db.collection("promo").get();
      context += "\n**PROMOCIONES DISPONIBLES:**\n";
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

      // Pedidos
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
          - Eres un asistente de atención al cliente de Multipizza
          - El usuario actual se llama: ${userName}
          - Puedes usar su nombre en las respuestas para ser más personal
          - Cuando se pregunte sobre precios de productos o promociones, muestra SIEMPRE el formato: S/. [número] (ejemplo: S/. 7.00)
          - Si el cliente te pregunta por los productos disponibles, menciona el nombre de los productos, pero no menciones los precios.
          - Si te preguntan en donde pueden encontrar los productos o promociones, indicale que debe darle click en la parte inferior de la pantalla, en el boton inicio con el icono que parece una casa.
          - Indicale que puede desplzarce con el menu tab que tiene en la parte inferior.
          - Solo menciona precios cuando el usuario pregunte específicamente sobre ellos
          - No menciones IDs, códigos internos, nombres de imágenes o detalles técnicos
          - Sé amable, profesional y útil con el usuario
          - Responde en español
          - Responde de forma concisa, breve y clara
          - Identifícate como asistente de Multipizza cuando sea necesario

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
