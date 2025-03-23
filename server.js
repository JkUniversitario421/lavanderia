const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const axios = require('axios');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const hgBrasilAPIKey = 'c657e670';

let fila = [];
let lavagens = [];

// URI do MongoDB
const uri = process.env.MONGO_URI || "mongodb+srv://jkuniversitario421:M%40iden25654545@cluster0.jz5ul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Conectar ao MongoDB uma vez e reutilizar
async function conectarMongoDB() {
    try {
        await client.connect();
        console.log("✅ Conectado ao MongoDB!");
    } catch (error) {
        console.error("❌ Erro ao conectar ao MongoDB:", error);
        process.exit(1); // Encerrar a aplicação se não conectar
    }
}

// Chamar a conexão uma vez ao iniciar
conectarMongoDB();

// Função para criar usuário
async function criarUsuario(telefone, nome) {
    try {
        const db = client.db("botdb");
        const usuariosCollection = db.collection('usuarios');
        const usuarioExistente = await usuariosCollection.findOne({ telefone });

        if (usuarioExistente) {
            return 'Usuário já existe!';
        }

        const result = await usuariosCollection.insertOne({ telefone, nome });

        if (result.acknowledged && result.insertedId) {
            return `Usuário ${nome} criado com sucesso! ID: ${result.insertedId}`;
        } else {
            return 'Falha ao criar usuário!';
        }
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return 'Erro ao criar usuário!';
    }
}

// Função para buscar o nome do usuário pelo telefone
async function buscarUsuarioPorTelefone(telefone) {
    try {
        const db = client.db("botdb");
        const usuariosCollection = db.collection('usuarios');
        const usuario = await usuariosCollection.findOne({ telefone });
        return usuario ? usuario.nome : 'Usuário';
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return 'Usuário';
    }
}

// Função para excluir usuário
async function excluirUsuario(telefone) {
    try {
        const db = client.db("botdb");
        const usuariosCollection = db.collection('usuarios');
        const result = await usuariosCollection.deleteOne({ telefone });

        if (result.deletedCount === 1) {
            return `Usuário com telefone ${telefone} excluído com sucesso.`;
        } else {
            return `Usuário com telefone ${telefone} não encontrado.`;
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return 'Erro ao excluir usuário!';
    }
}

// Configuração do menu de opções
const menuOptions = `
Escolha uma das opções abaixo:
1️⃣ Para saber como usar 🤷‍♀️🤷‍♂️
2️⃣ Informações técnicas 🧰
3️⃣ Iniciar lavagem 🔛
4️⃣ Finalizar lavagem 🔚
5️⃣ Entrar na fila de lavagem 🚶🚶🚶
6️⃣ Desistir da fila de lavagem 🚶🚶
7️⃣ Tabela de peso das roupas 👖🩲👗👕👚
8️⃣ Horário de funcionamento 🕒🕗🕤
9️⃣ Previsão do tempo ⛈️☀️🌤️🌨️
🔟 Dias de coleta de lixo ♻️
`;

// Rota do webhook
app.post('/webhook', async (req, res) => {
    console.log('Recebido:', JSON.stringify(req.body, null, 2));

    const intentName = req.body.queryResult.intent.displayName;
    const option = Number(req.body.queryResult.queryText);
    const telefone = req.body.originalDetectIntentRequest.payload.data?.from || ''; 
    const user = await buscarUsuarioPorTelefone(telefone);

    if (intentName === 'Mostrar Menu') {
        return res.json({ fulfillmentText: menuOptions });
    }

    switch (option) {
        case 1:
            res.json({ fulfillmentText: `Veja como usar aqui: https://youtu.be/2O_PWz-0qic` });
            break;

        case 2:
            res.json({ fulfillmentText: "🔧 Informações técnicas sobre a lavanderia." });
            break;

        case 3:
            const currentTime = moment().tz("America/Sao_Paulo");
            const endTime = currentTime.clone().add(2, 'hours');
            lavagens.push({ user, startTime: currentTime.toISOString(), endTime: endTime.toISOString() });
            res.json({ fulfillmentText: `Lavagem iniciada para ${user}! ⏳` });
            break;

        case 4:
            const lavagem = lavagens.find(l => l.user === user);
            if (lavagem) {
                lavagens = lavagens.filter(l => l.user !== user);
                res.json({ fulfillmentText: `Lavagem finalizada para ${user}! 🏁` });
            } else {
                res.json({ fulfillmentText: `Nenhuma lavagem ativa encontrada para ${user}.` });
            }
            break;

        case 5:
            fila.push({ user, entryTime: moment().tz("America/Sao_Paulo").toISOString() });
            res.json({ fulfillmentText: `${user} entrou na fila! 📋` });
            break;

        case 6:
            fila = fila.filter(f => f.user !== user);
            res.json({ fulfillmentText: `${user} saiu da fila. 🚶` });
            break;

        case 7:
            res.json({ fulfillmentText: `Tabela de peso das roupas não implementada.` });
            break;

        case 8:
            res.json({ fulfillmentText: `Horário de funcionamento: 7:00 às 22:00.` });
            break;

        case 9:
            res.json({ fulfillmentText: `Previsão do tempo não implementada.` });
            break;

        case 10:
            res.json({ fulfillmentText: `Dias de coleta: Terça, Quinta e Sábado.` });
            break;

        default:
            res.json({ fulfillmentText: `Opção inválida! 🤔` });
    }
});

// Inicialização do servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
