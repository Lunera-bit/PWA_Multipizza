import { onRequest } from 'firebase-functions/v2/https';
import axios from 'axios';
import * as admin from 'firebase-admin';

admin.initializeApp();

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const PAYPAL_CLIENT_ID =
  'AVID1fQErsLxWjsfqy09zjgtbEBJDcZS6ejSlWsRqGJuiuDb-XhQsHLMh8-vT91wZoamyrnDh6t9sJWd';
const PAYPAL_SECRET =
  'ENXfFUPE4W87OLnE0JU70GXlJWfaPAZucS9uZCsiwRvKxYV7cAWpOZwYPxlOux1Z9opL69giULP95EQ5';
const PAYPAL_API = 'https://api.sandbox.paypal.com';
const EXCHANGE_RATE = 3.4;
const db = admin.firestore();

export const chatbot = onRequest({ timeoutSeconds: 300 }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const message = req.body?.message;
    const userName = req.body?.userName || 'Usuario';
    const isFirstMessage = req.body?.isFirstMessage || false;

    if (!message) {
      res.status(400).json({ error: 'Missing message' });
      return;
    }

    let context = 'Contexto del negocio:\n\n';

    // Productos
    const productsSnapshot = await db.collection('products').get();
    const products: any[] = [];
    context += '**PRODUCTOS DISPONIBLES:**\n';
    productsSnapshot.forEach((doc) => {
      const data = doc.data();
      const productInfo = {
        id: doc.id,
        nombre: data.nombre,
        precio: data.precio,
        descripcion: data.descripcion,
        categoria: data.categoria,
        tags: data.tags || [],
      };
      products.push(productInfo);
      context += `- ${JSON.stringify(productInfo)}\n`;
    });

    // Promociones
    const promosSnapshot = await db.collection('promo').get();
    const promos: any[] = [];
    context += '\n**PROMOCIONES DISPONIBLES:**\n';
    promosSnapshot.forEach((doc) => {
      const data = doc.data();
      const promoInfo = {
        id: doc.id,
        nombre: data.nombre,
        precio: data.precio,
        descripcion: data.descripcion,
      };
      promos.push(promoInfo);
      context += `- ${JSON.stringify(promoInfo)}\n`;
    });

    let systemPrompt = `${context}\n\nINSTRUCCIONES IMPORTANTES:
        - Eres un asistente de atención al cliente de Multipizza
        - El usuario actual se llama: ${userName}
        - Puedes usar su nombre en las respuestas para ser más personal
        - Cuando se pregunte sobre precios de productos o promociones, muestra SIEMPRE el formato: S/. [número] (ejemplo: S/. 7.00)
        - Solo menciona precios cuando el usuario pregunte específicamente sobre ellos
        - No menciones IDs, códigos internos, nombres de imágenes o detalles técnicos
        - Sé amable, profesional y útil con el usuario
        - Responde en español
        - Responde de forma concisa, breve y clara
        - Identifícate como asistente de Multipizza cuando sea necesario
        

        // NUEVAS INSTRUCCIONES PARA MANEJAR LAS OPCIONES INICIALES
        - **FASE 1 - Opción Inicial (Mensaje: '1' o similar):** Si el usuario elige la opción '1' (Recomendar pizzas personalizadas), responde con formato **'text'** y pregunta directamente qué tipo de pizza desea, mencionando los tags comunes (ej. "¿Qué tipo de pizza te gustaría? ¿Carne, vegetariana, o quizás algo más exótico?").

        - **FASE 2 - Muestra de Opciones (Mensaje: contiene un Tag como 'carne', 'vegetariana'):** Si el mensaje del usuario indica un tipo o 'tag' de pizza (ej. 'carne', 'picante', 'vegetariana'), DEBES hacer lo siguiente:
         1. Busca **todos** los productos en tu contexto que contengan ese 'tag' en su lista de tags.
         2. Responde con formato **'product_list'**.
         3. La propiedad 'text' debe ser una frase como: "Aquí tienes nuestras opciones de pizzas tipo [tag] que te podrían gustar. Dime el nombre de la que más te apetece para ver los detalles y agregarla."

        - **FASE 3 - Selección del Producto (Mensaje: contiene un nombre de pizza/promoción):** Si el usuario menciona el **nombre exacto** de un producto o promoción que ya ha sido listado, DEBES hacer lo siguiente:
         1. Encuentra ese producto/promoción en el contexto.
         2. Responde con formato **'product_card'**.
         3. La propiedad 'text' debe ser: "¡Excelente elección! Aquí tienes los detalles de la [Nombre del Producto/Promoción]. ¿Deseas agregarla al carrito o te gustaría ver alguna otra cosa?"

        - **Otras Opciones:**
         - Si el usuario elige la opción '2' (Información detallada de productos): Pregúntale al usuario qué tipo de producto o categoría está buscando. Responde en formato JSON tipo 'text'.
         - Si el usuario elige la opción '3' (Información de promociones disponibles): Muestra todas las promociones disponibles. Responde en formato JSON tipo 'product_list'.
        IMPORTANTE - SISTEMA DE RESPUESTAS:
        Si el usuario pide un producto específico o quiere agregar algo al carrito, SIEMPRE responde con JSON en este formato exacto:
          {
            "type": "product_card",
            "text": "Tu mensaje aquí",
            "product": {
              "id": "id_del_producto",
              "nombre": "Nombre del Producto",
              "precio": 19.99,
              "descripcion": "Descripción corta"
            }
          }
          
          Para múltiples productos, usa type "product_list":
          {
            "type": "product_list",
            "text": "Tu mensaje aquí",
            "products": [
              {"id": "id1", "nombre": "Producto 1", "precio": 10.99, "descripcion": "..."},
              {"id": "id2", "nombre": "Producto 2", "precio": 15.99, "descripcion": "..."}
            ]
          }
          
          Para respuestas normales de texto:
          {
            "type": "text",
            "text": "Tu respuesta aquí"
          }`;

    if (isFirstMessage) {
      const welcomeMessage = `¡Hola ${userName}! Bienvenido/a a nuestra pizzería. ¿En qué puedo ayudarte hoy?

        \nAntes de empezar, recuerda que puedes elegir entre estas opciones:

        \n1. Recomiendame una pizzas personalizadas
        \n2. Información detallada de productos
        \n3. Información de promociones disponibles

        ✨ Solo dime el número de la opción que prefieres o cuéntame qué necesitas.`;

      systemPrompt += `\n\nEsta es la PRIMERA interacción del usuario. Tu única tarea es responder en formato JSON tipo "text" usando el siguiente texto exacto en la propiedad "text":
                
        ${welcomeMessage}
                
        Asegúrate de reemplazar el nombre del usuario correctamente.
        asegurate de mostrar siempre las opciones`;
    }

    const response = await axios.post(
      OLLAMA_URL,
      {
        model: 'llama3',
        prompt: `${systemPrompt}

        Usuario pregunta: ${message}`,
        stream: false,
      },
      {
        timeout: 120000,
      }
    );

    const reply = response.data?.response || 'No response';

    // Intentar parsear como JSON
    let parsedReply;
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedReply = JSON.parse(jsonMatch[0]);
      } else {
        parsedReply = { type: 'text', text: reply };
      }
    } catch {
      parsedReply = { type: 'text', text: reply };
    }

    res.json(parsedReply);
  } catch (error) {
    console.error('Error:', error);
    res
      .status(500)
      .json({ type: 'text', text: 'Error conectando al servidor X-X' });
  }
});
export const paypalCreateOrder = onRequest(
  { timeoutSeconds: 300, cors: true },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      let { amount, description } = req.body;

      if (!amount || !description) {
        res.status(400).json({ error: 'Missing amount or description' });
        return;
      }

      const amountInUSD = (amount / EXCHANGE_RATE).toFixed(2);

      if (!PAYPAL_SECRET || PAYPAL_SECRET.length === 0) {
        res.status(500).json({ error: 'PayPal Secret not configured' });
        return;
      }

      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString(
        'base64'
      );

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amountInUSD,
            },
            description: description,
          },
        ],
      };

      const response = await axios.post(
        `${PAYPAL_API}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      res
        .status(500)
        .json({
          error: 'Failed to create order',
          details: error.response?.data,
        });
    }
  }
);

export const paypalCaptureOrder = onRequest(
  { timeoutSeconds: 300, cors: true },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const { orderId } = req.body;

      if (!orderId) {
        res.status(400).json({ error: 'Missing orderId' });
        return;
      }

      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString(
        'base64'
      );

      const response = await axios.post(
        `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      res
        .status(500)
        .json({
          error: 'Failed to capture order',
          details: error.response?.data,
        });
    }
  }
);
