const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const hgBrasilAPIKey = 'c657e670';

let fila = [];
let lavagens = [];

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

app.post('/webhook', async (req, res) => {
    console.log('Recebido:', JSON.stringify(req.body, null, 2));

    const intentName = req.body.queryResult.intent.displayName;
    const option = Number(req.body.queryResult.queryText);
    const user = req.body.queryResult.parameters.user || 'Usuário';
    
    if (intentName === 'Mostrar Menu') {
        return res.json({ fulfillmentText: menuOptions });
    }

    switch (option) {
        case 1: {
            res.json({
                fulfillmentText: `Siga as dicas para uma boa utilização pelo link:\nhttps://youtu.be/2O_PWz-0qic`
            });
            break;
        }
        case 2: {
            res.json({
                fulfillmentText: `
                    🔧🛠️🔩🧰🔧🛠️🔩🧰
                    INFORMAÇÕES TÉCNICAS
                    - Lavadora de Roupas Electrolux
                    - Capacidade: *8,5Kg*
                    - Modelo: LT09E Top Load Turbo Agitação Super
                    - Programas de Lavagem: 9
                    - Níveis de Água: 4
                    - Cor: Branca

                    CARACTERÍSTICAS
                    - Capacidade *(kg de roupas)*: *8,5Kg*
                    - Acesso ao cesto: *Superior*
                    - Água quente: *Não*
                    - Enxágues: *1*    
                    - Centrifugação: *Sim* 
                    - Dispenser para sabão: *Sim*
                    - Dispenser para amaciante: *Sim*
                    - Dispenser para alvejante: *Sim*
                    - Elimina fiapos: *Sim - através do filtro*
                    - Níveis de água: *Extra, Baixo, Médio, Alto*

                    ESPECIFICAÇÕES TÉCNICAS
                    - Consumo: (kWh) *0,25kWh/ciclo*
                    - Controles: *Eletromecânicos*  
                    - Velocidade de centrifugação: *(rpm)* *660*
                    - Tensão/Voltagem: *220V* 
                    - Acabamento do cesto: *Polipropileno*
                    - Consumo de Energia: *A (menos 25% de consumo)*
                    - Consumo de água: *112 litros por ciclo*
                    - Eficiência Energética: *A*

                    Uma boa lavagem! 🔧🛠️🔩🧰🔧🛠️🔩🧰 `
            });
            break;
        }
        case 3: {
            const currentTime = moment().tz("America/Sao_Paulo");
            const endTime = currentTime.clone().add(2, 'hours');
            lavagens.push({ user, startTime: currentTime.toISOString(), endTime: endTime.toISOString() });

            setTimeout(() => {
                console.log(`🔔 Notificação: 5 minutos restantes para ${user}`);
            }, 115 * 60 * 1000); 

            res.json({
                fulfillmentText: `Lavagem iniciada! ⏳\nHora de início: *${currentTime.format('HH:mm:ss')}*\n Programada para terminar às: *${endTime.format('HH:mm:ss')}* 🕑`
            });
            break;
        }

        case 4: {
            const currentTime = moment().tz("America/Sao_Paulo");
            const lavagem = lavagens.find(l => l.user === user);
            if (lavagem) {
                const duration = currentTime.diff(moment(lavagem.startTime), 'minutes');
                lavagens = lavagens.filter(l => l.user !== user);
                let aviso = duration > 120 ? `⚠️ Atenção! Sua lavagem ultrapassou o tempo recomendado de 2 horas. Lembre-se de respeitar o tempo para melhor eficiênc` : `🎉 Parabéns! Você seguiu o tempo recomendado de lavagem. Obrigado por sua colaboração`;
                res.json({
                    fulfillmentText: `Lavagem finalizada! 🏁\nDuração: *${duration} minutos*\n${aviso}`
                });
            } else {
                res.json({
                    fulfillmentText: `Você saiu da fila de lavagem às *${currentTime.format('HH:mm:ss')}*.` // Incluindo os segundos
            }
            break;
        }

        case 5: {
            fila.push({ user, entryTime: moment().tz("America/Sao_Paulo").toISOString() });
            let position = fila.findIndex(f => f.user === user) + 1;
            let waitingTime = lavagens.length > 0 ? moment(lavagens[0].endTime).tz("America/Sao_Paulo").diff(moment(), 'minutes') : 0;
            res.json({
                fulfillmentText: `Você entrou na fila! 📋\nPosição na fila: *${position}*️⃣\nTempo estimado: *${waitingTime} minutos* ⏳`
            });
            break;
        }

        case 6: {
            fila = fila.filter(f => f.user !== user);
            res.json({ fulfillmentText: `Você saiu da fila. 🚶` });
            break;
        }

        case 7: {
            const items = [
            { item: 'Calça jeans de adulto', weight: 700 },
            { item: 'Jaqueta jeans', weight: 750 },
            { item: 'Camiseta de algodão', weight: 200 },
            { item: 'Peças íntimas', weight: 75 },
            { item: 'Conjunto de pijama', weight: 500 },
            { item: 'Conjunto de moletom adulto', weight: 750 },
            { item: 'Lençol de solteiro', weight: 400 },
            { item: 'Lençol de casal', weight: 800 },
            { item: 'Fronha de travesseiro', weight: 50 },
            { item: 'Toalha de banho', weight: 500 },
            { item: 'Toalha de rosto', weight: 250 },
            { item: 'Blusa de lã', weight: 400 },
            { item: 'Camisa social', weight: 250 },
            { item: 'Bermuda de sarja', weight: 300 },
            { item: 'Shorts de algodão', weight: 150 },
            { item: 'Meias', weight: 50 },
            { item: 'Sutiã', weight: 100 },
            { item: 'Camiseta térmica', weight: 150 },
            { item: 'Camiseta esportiva', weight: 180 },
            { item: 'Saia de algodão', weight: 200 },
            { item: 'Vestido de verão', weight: 300 },
            { item: 'Cachecol', weight: 100 },
            { item: 'Calça de moletom', weight: 500 },
            { item: 'Roupa de ginástica', weight: 250 }
        ];


                const MAX_WEIGHT = 6000; // Limite de peso em gramas
                const MAX_COMBINATIONS = 7;

                function calculateTotalWeight(combination) {
                    return combination.reduce((total, currentItem) => total + currentItem.weight, 0);
                }

                function getRandomCombination(items, weightLimit) {
                    let combination = [];
                    let totalWeight = 0;

                    let shuffledItems = items.sort(() => 0.5 - Math.random());
                    for (const item of shuffledItems) {
                        if (totalWeight + item.weight <= weightLimit) {
                            combination.push(item);
                            totalWeight += item.weight;
                        }
                        if (totalWeight >= weightLimit) break;
                    }
                    return combination;
                }

                let randomCombinations = [];
                while (randomCombinations.length < MAX_COMBINATIONS) {
                    let combination = getRandomCombination(items, MAX_WEIGHT);
                    if (combination.length > 0) {
                        randomCombinations.push(combination);
                    }
                }

                res.json({
                    fulfillmentText: `Aqui estão as combinações sugeridas para as roupas com o limite de peso de ${MAX_WEIGHT}g:\n\n` + randomCombinations.map((combo, idx) => {
                        return `Opção ${idx + 1}: ${combo.map(item => item.item).join(', ')} (Peso total: ${calculateTotalWeight(combo)}g)`;
                    }).join("\n")
                });

                break;
            }

case 8: {
                const currentTime = moment().tz("America/Sao_Paulo");
                const closingTime = currentTime.clone().set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
                const latestStartTime = closingTime.clone().subtract(2, 'hours');
                if (currentTime.isBefore(latestStartTime)) {
                    res.json({
                        fulfillmentText: `O horário de funcionamento da lavanderia é das 7:00 às 22:00. Iniciando uma lavagem agora, você deve terminar até as ${closingTime.format('HH:mm')}.`
                    });
                } else {
                    res.json({
                        fulfillmentText: 'A lavanderia está fechada agora. O horário de funcionamento é das 7:00 às 22:00.'
                    });
                }
                break;
            }
case 9: {
        try {
            // URL da API de previsão do tempo, utilizando a cidade de Viamão (Rio Grande do Sul)
            const weatherUrl = `https://api.hgbrasil.com/weather?key=c657e670&city_name=Viamão,RS`;

            // Obter a previsão do tempo
            const weatherResponse = await axios.get(weatherUrl);
            const weather = weatherResponse.data.results;
            const forecast = weather.forecast[0];

            // Emojis para as temperaturas
            let temperatureMaxEmoji = forecast.max > 22 ? '🔥' : '❄️';
            let temperatureMinEmoji = forecast.min < 22 ? '❄️' : '🔥';

            // Emoji para a descrição do clima
            let weatherEmoji = '';
            if (forecast.description.toLowerCase().includes('chuva')) {
                weatherEmoji = '🌧️';
            } else if (forecast.description.toLowerCase().includes('nublado')) {
                weatherEmoji = '☁️';
            } else if (forecast.description.toLowerCase().includes('sol')) {
                weatherEmoji = '☀️';
            }

            // Resposta com a previsão do tempo detalhada
            res.json({
                fulfillmentText: `Previsão do tempo para *Viamão, RS*:\n\n` +
                    `Data: *${forecast.date}*\n` +
                    `Descrição: ${forecast.description} ${weatherEmoji}\n` +
                    `Temperatura: *${forecast.min}ºC* ${temperatureMinEmoji} a *${forecast.max}ºC* ${temperatureMaxEmoji}\n` +
                    `Umidade: *${forecast.humidity}%*\n` +
                    `Velocidade do vento: *${forecast.wind_speed} km/h*\n` +
                    `Precipitação: *${forecast.rain} mm*\n` +
                    `Sol nascer: *${forecast.sunrise}*\n` +
                    `Sol se pôr: *${forecast.sunset}*\n` +
                    `Resumo: ${forecast.description}.`
            });
        } catch (error) {
            console.error('Erro ao obter a previsão do tempo:', error);
            res.json({
                fulfillmentText: 'Desculpe, não foi possível obter a previsão do tempo no momento.'
            });
        }
break;
}
       case 10:
    res.json({
        fulfillmentText: `🚛 **Dias de Coleta de Lixo** 🚛\n\n🗑️ *Dias*: Terça, Quinta e Sábado\n\n♻️ Vamos cuidar do meio ambiente! Separe o seu lixo corretamente. ♻️`
    });
    break;
default:
    res.json({ fulfillmentText: 'Opção inválida. Escolha um número do menu.' });
}
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
