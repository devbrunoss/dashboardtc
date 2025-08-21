// VERSÃO COMPLETA E TESTADA - ATUALIZADA
document.addEventListener('DOMContentLoaded', async function () {
  console.log("Iniciando TrackCripto...");

  // 1. ELEMENTOS DA UI
  const elements = {
    price: document.getElementById('price'),
    variation: document.getElementById('variation'),
    rank: document.getElementById('rank'),
    marketCap: document.getElementById('market-cap'),
    volume: document.getElementById('volume'),
    supply: document.getElementById('supply'),
    fearGreedText: document.getElementById('fear-greed-text'),
    fearGreedIndicator: document.getElementById('fear-greed-indicator'),
    newsContainer: document.getElementById('news-container'),
    chatInput: document.getElementById('userInput'),
    chatContent: document.getElementById('chatContent'),
    cryptoName: document.getElementById('cryptoName'),
    riskValue: document.getElementById('risk-value'),
    riskExplanation: document.getElementById('risk-explanation'),
    riskResult: document.getElementById('risk-result')
  };

  // Lista de criptomoedas para o portfólio
  const coins = [
    { id: "bitcoin", name: "Bitcoin (BTC)" },
    { id: "ethereum", name: "Ethereum (ETH)" },
    { id: "tether", name: "Tether (USDT)" },
    { id: "bnb", name: "BNB (BNB)" },
    { id: "solana", name: "Solana (SOL)" },
    { id: "cardano", name: "Cardano (ADA)" },
    { id: "xrp", name: "XRP (XRP)" },
    { id: "dogecoin", name: "Dogecoin (DOGE)" }
  ];

  // 2. FUNÇÃO DE FETCH COM TRATAMENTO DE ERROS
  async function safeFetch(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Erro na requisição:", error);
      return null;
    }
  }

  // 3. ATUALIZAÇÃO DE DADOS DA CRIPTO
  async function updateCryptoData() {
    const moeda = document.getElementById('moedaSelect').value;
    const data = await safeFetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${moeda}&vs_currencies=brl&include_24hr_change=true`
    );

    if (data && data[moeda]) {
      elements.price.textContent = `R$ ${data[moeda].brl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const change = data[moeda].brl_24h_change;
      elements.variation.innerHTML = `Variação 24h: <span style="color:${change >= 0 ? '#00ff88' : '#ff4d4d'}">${change.toFixed(2)}%</span>`;
    }
  }

  // 4. MÉTRICAS AVANÇADAS
  async function updateAdvancedMetrics() {
    const moeda = document.getElementById('moedaSelect').value;
    const data = await safeFetch(`https://api.coingecko.com/api/v3/coins/${moeda}`);

    if (data) {
      elements.rank.textContent = data.market_cap_rank || '--';
      elements.marketCap.textContent = `R$ ${(data.market_data.market_cap.brl / 1000000000).toFixed(2)}B`;
      elements.volume.textContent = `R$ ${(data.market_data.total_volume.brl / 1000000000).toFixed(1)}B`;
      if (data.market_data.circulating_supply) {
        elements.supply.textContent = `${data.market_data.circulating_supply.toLocaleString('pt-BR')} ${data.symbol.toUpperCase()}`;
      }
      elements.cryptoName.textContent = `${data.name} (${data.symbol.toUpperCase()})`;
    }
  }

  // 5. FEAR & GREED INDEX
  async function updateFearGreed() {
    const data = await safeFetch('https://api.alternative.me/fng/?limit=1');

    if (data && data.data) {
      const value = data.data[0].value;
      elements.fearGreedIndicator.style.left = `${value}%`;
      elements.fearGreedText.textContent = `${value} - ${data.data[0].value_classification}`;
      document.getElementById('fg-update').textContent = new Date(data.data[0].timestamp * 1000).toLocaleString('pt-BR');
    }
  }

  // 6. GRÁFICO DE PREÇOS
  async function initChart() {
    const moeda = document.getElementById('moedaSelect').value;
    const ctx = document.getElementById('graficoBTC').getContext('2d');
    const data = await safeFetch(`https://api.coingecko.com/api/v3/coins/${moeda}/market_chart?vs_currency=brl&days=7`);

    if (data) {
      if (window.btcChart) window.btcChart.destroy();

      const labels = data.prices.map(price =>
        new Date(price[0]).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
      );
      const prices = data.prices.map(price => price[1]);

      // Configuração otimizada para mobile
      window.btcChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `Preço ${moeda.toUpperCase()} (R$)`,
            data: prices,
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0, 255, 136, 0.05)',
            borderWidth: 2,
            pointRadius: mobile ? 2 : 3,
            pointBackgroundColor: '#00ff88',
            pointHoverRadius: 4,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              displayColors: false,
              callbacks: {
                label: (ctx) => `R$ ${ctx.parsed.y.toLocaleString('pt-BR')}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: mobile ? 4 : 7
              }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                callback: (value) => `R$ ${(value / 1000).toFixed(0)}k`
              }
            }
          },
          interaction: { mode: 'nearest' }
        }
      });
    }
  }

  // Detecta mobile
  const mobile = window.innerWidth <= 768;
  
  // 7. CALCULADORA DE RISCO
  function setupRiskCalculator() {
    document.getElementById('coin').addEventListener('change', function () {
      document.getElementById('risk-result').style.display = 'none';
    });

    document.getElementById('investment').addEventListener('input', function () {
      document.getElementById('risk-result').style.display = 'none';
    });

    // Atualize a função calculateRisk() para:
    window.calculateRisk = function () {
      const investment = parseFloat(document.getElementById('investment').value);
      const coin = document.getElementById('coin').value;

      if (!investment || investment <= 0) {
        alert("Por favor, insira um valor válido!");
        return;
      }

      const volatilityData = {
        bitcoin: 2.1,
        ethereum: 3.5,
        solana: 4.8,
        cardano: 3.2
      };

      const volatility = volatilityData[coin] || 3.0;
      const maxRecommended = (investment * 0.02) / (volatility / 100);

      document.getElementById('risk-value').innerHTML = `
        <strong>Valor máximo recomendado por trade:</strong> R$ ${maxRecommended.toFixed(2)}<br>
        <strong>Volatilidade histórica:</strong> ${volatility}%
      `;

      document.getElementById('risk-explanation').textContent =
        `Baseado na volatilidade histórica do ${coin.toUpperCase()}, recomendamos não arriscar mais que R$ ${maxRecommended.toFixed(2)} em uma única operação.`;

      document.getElementById('risk-result').style.display = 'block';
    }
  }

  // 8. CHAT IA
  function setupChat() {
    const chatToggle = document.getElementById('chatToggle');
    const chatContainer = document.getElementById('aiChatContainer');
    const closeChat = document.getElementById('closeChat');

    chatToggle.addEventListener('click', () => {
      chatContainer.style.display = chatContainer.style.display === 'none' ? 'block' : 'none';
    });

    closeChat.addEventListener('click', () => {
      chatContainer.style.display = 'none';
    });

    document.getElementById('sendMessage').addEventListener('click', sendMessage);
    document.getElementById('userInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
      const message = elements.chatInput.value.trim();
      if (!message) return;

      // Mensagem do usuário
      elements.chatContent.innerHTML += `
        <div style="text-align:right; margin:10px 0">
          <div style="display:inline-block; background:rgba(0,255,136,0.2); padding:8px 12px; border-radius:12px 12px 0 12px">
            ${message}
          </div>
        </div>
      `;

      // Resposta da IA
      setTimeout(() => {
        elements.chatContent.innerHTML += `
          <div style="margin:10px 0">
            <div style="display:inline-block; background:rgba(0,255,136,0.1); padding:8px 12px; border-radius:12px 12px 12px 0">
              ${getAIResponse(message)}
            </div>
          </div>
        `;
        elements.chatContent.scrollTop = elements.chatContent.scrollHeight;
      }, 500);

      elements.chatInput.value = '';
    }

    function getAIResponse(message) {
      const lowerMsg = message.toLowerCase();
      const responses = {
        bitcoin: [
          `📊 BTC está cotado a ${elements.price.textContent} (${document.getElementById('variation').textContent})`,
          "🔍 Bitcoin está mostrando forte resistência nos níveis atuais!",
          "💡 Dica: Analise o gráfico para identificar tendências"
        ],
        ethereum: [
          "🦄 Ethereum está em alta com a próxima atualização da rede",
          "💎 ETH/BTC pair mostra fortalecimento"
        ],
        default: [
          "Pergunte sobre Bitcoin ou Ethereum!",
          "Posso ajudar com análises de BTC e ETH"
        ]
      };

      if (lowerMsg.includes('bitcoin') || lowerMsg.includes('btc')) {
        return responses.bitcoin[Math.floor(Math.random() * responses.bitcoin.length)];
      } else if (lowerMsg.includes('ethereum') || lowerMsg.includes('eth')) {
        return responses.ethereum[Math.floor(Math.random() * responses.ethereum.length)];
      }
      return responses.default[Math.floor(Math.random() * responses.default.length)];
    }
  }

  // 9. NOTÍCIAS
  async function loadNews() {
    try {
      // API alternativa para notícias (substitua por uma API real se necessário)
      elements.newsContainer.innerHTML = `
        <div style="margin-bottom:15px">
          <h3>Bitcoin atinge novo recorde histórico</h3>
          <p style="color:#aaa">O BTC superou a marca de R$ 650k nesta semana</p>
         
        <div style="margin-bottom:15px">
          <h3>Ethereum anuncia atualização da rede</h3>
          <p style="color:#aaa">A atualização deve melhorar as taxas de transação</p>
          
      `;
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
      elements.newsContainer.innerHTML = '<p style="color:#ff4d4d">Notícias indisponíveis no momento</p>';
    }
  }

  // 10. ÍNDICES DE MERCADO - VERSÃO FINAL
  const MarketIndices = {
    init() {
      this.setupEventListeners();
      this.loadInitialData();
    },

    setupEventListeners() {
      const refreshBtn = document.getElementById('refreshIndicesBtn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.loadData();
        });
      }
    },

    loadInitialData() {
      this.loadData();
      setInterval(() => this.loadData(), 300000); // Atualiza a cada 5 minutos
    },

    async loadData() {
      this.showLoadingState(true);

      try {
        const data = await this.fetchMarketData();
        this.updateMarketUI(data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        this.showErrorState();
      }
    },

    async fetchMarketData() {
      const response = await fetch('https://api.coingecko.com/api/v3/global');
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();
      return data.data;
    },

    updateMarketUI(data) {
      this.updateTimestamp();
      this.updateBTCDominance(data.market_cap_percentage.btc);
      this.updateAltcoinSeason(data);
    },

    updateTimestamp() {
      const timeElement = document.getElementById('lastUpdateTime');
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },

    updateBTCDominance(btcDominance) {
      const dominanceValue = btcDominance.toFixed(1);
      const valueElement = document.getElementById('btcDominanceValue');
      const barElement = document.getElementById('btcDominanceBar');

      if (valueElement) valueElement.textContent = `${dominanceValue}%`;
      if (barElement) barElement.style.width = `${dominanceValue}%`;
    },

    updateAltcoinSeason(data) {
      const btcDominance = data.market_cap_percentage.btc;
      const totalMarketCap = (data.total_market_cap.usd / 1000000000).toFixed(2);
      const altcoinDominance = 100 - btcDominance;

      const marketCapElement = document.getElementById('totalMarketCap');
      const seasonIndicator = document.getElementById('seasonIndicator');
      const statusTextElement = document.getElementById('seasonStatusText');
      const errorElement = document.getElementById('btcChartError');

      if (marketCapElement) marketCapElement.textContent = `$${totalMarketCap}B`;

      if (seasonIndicator) {
        seasonIndicator.style.background =
          `linear-gradient(90deg, #2ecc71 ${altcoinDominance}%, #e0e0e0 ${altcoinDominance}%)`;
      }

      if (statusTextElement) {
        statusTextElement.textContent =
          altcoinDominance > 35 ? "🚀 ALTCOIN SEASON!" : `📉 Bitcoin Dominante (${btcDominance.toFixed(1)}%)`;
      }

      if (errorElement) errorElement.style.display = 'none';
    },

    showLoadingState(loading) {
      const loadingText = loading ? '...' : '';
      const loadingStatus = loading ? 'Atualizando...' : '';

      const valueElement = document.getElementById('btcDominanceValue');
      const statusElement = document.getElementById('seasonStatusText');

      if (valueElement) valueElement.textContent = loadingText;
      if (statusElement) statusElement.textContent = loadingStatus;
    },

    showErrorState() {
      const errorElement = document.getElementById('btcChartError');
      const statusElement = document.getElementById('seasonStatusText');

      if (errorElement) errorElement.style.display = 'block';
      if (statusElement) statusElement.textContent = 'Dados temporariamente indisponíveis';
    }
  };

  // 11. PORTFÓLIO SIMULADOR
  class PortfolioSimulator {
    constructor() {
      this.assets = JSON.parse(localStorage.getItem('portfolio')) || [];
      this.init();
    }

    init() {
      document.getElementById('addAsset').addEventListener('click', this.showAddDialog.bind(this));
      document.getElementById('refreshPortfolio').addEventListener('click', this.refreshPortfolio.bind(this));
      this.render();
    }

    showAddDialog() {
      // Modal para adicionar novo ativo
      Swal.fire({
        title: 'Adicionar Ativo',
        html: `
          <select id="swalCoin" class="swal2-select">
            ${coins.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
          <input type="number" id="swalAmount" placeholder="Quantidade" class="swal2-input">
          <input type="number" id="swalPrice" placeholder="Preço pago (R$)" class="swal2-input">
        `,
        showCancelButton: true,
        confirmButtonText: 'Adicionar',
        preConfirm: () => {
          return {
            coin: document.getElementById('swalCoin').value,
            amount: parseFloat(document.getElementById('swalAmount').value),
            buyPrice: parseFloat(document.getElementById('swalPrice').value)
          }
        }
      }).then(result => {
        if (result.isConfirmed) {
          this.addAsset(result.value);
        }
      });
    }

    addAsset(asset) {
      this.assets.push(asset);
      this.save();
      this.render();

      // Microinteração: Confirmação visual
      const confirmation = document.createElement('div');
      confirmation.className = 'portfolio-confirmation';
      confirmation.innerHTML = `<i class="fas fa-check"></i> ${asset.coin} adicionado!`;
      document.getElementById('portfolio').appendChild(confirmation);
      setTimeout(() => confirmation.remove(), 2000);
    }

    removeAsset(index) {
      this.assets.splice(index, 1);
      this.save();
      this.render();
    }

    async refreshPortfolio() {
      // Mostra animação de atualização
      document.getElementById('portfolio').classList.add('updating');
      setTimeout(() => {
        document.getElementById('portfolio').classList.remove('updating');
      }, 1000);

      this.render();
    }

    save() {
      localStorage.setItem('portfolio', JSON.stringify(this.assets));
    }

    async render() {
      // Atualiza tabela e gráfico de pizza
      await this.updateTable();
      this.updateChart();
    }

    async updateTable() {
      const tableBody = document.getElementById('portfolioAssets');
      tableBody.innerHTML = '';

      if (this.assets.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-muted);">
              Nenhum ativo adicionado. Clique em "Adicionar Ativo" para começar.
            </td>
          </tr>
        `;
        return;
      }

      // Busca preços atuais em paralelo
      const coinIds = this.assets.map(a => a.coin);
      const pricesResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=brl`);
      const prices = await pricesResponse.json();

      let totalValue = 0;
      let totalProfit = 0;

      this.assets.forEach((asset, index) => {
        const currentPrice = prices[asset.coin]?.brl || 0;
        const value = asset.amount * currentPrice;
        const cost = asset.amount * asset.buyPrice;
        const profit = value - cost;
        const profitPercentage = (profit / cost) * 100;

        totalValue += value;
        totalProfit += profit;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${coins.find(c => c.id === asset.coin)?.name || asset.coin}</td>
          <td>${asset.amount.toLocaleString('pt-BR')}</td>
          <td>R$ ${asset.buyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td>R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td style="color:${profit >= 0 ? '#00ff88' : '#ff4d4d'}">
            ${profit >= 0 ? '+' : ''}${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${profitPercentage.toFixed(2)}%)
          </td>
          <td>
            <button class="btn" style="padding: 5px 10px; background: var(--error);" onclick="portfolio.removeAsset(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      // Adiciona linha de totais
      const totalRow = document.createElement('tr');
      totalRow.style.fontWeight = 'bold';
      totalRow.innerHTML = `
        <td colspan="3">Total</td>
        <td>R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td style="color:${totalProfit >= 0 ? '#00ff88' : '#ff4d4d'}">
          ${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </td>
        <td></td>
      `;
      tableBody.appendChild(totalRow);
    }

    updateChart() {
      const ctx = document.getElementById('portfolioChart').getContext('2d');

      if (this.assets.length === 0) {
        if (window.portfolioChart) {
          window.portfolioChart.destroy();
        }
        return;
      }

      // Agrupa ativos por moeda
      const grouped = {};
      this.assets.forEach(asset => {
        if (!grouped[asset.coin]) {
          grouped[asset.coin] = {
            amount: 0,
            buyPrice: asset.buyPrice,
            name: coins.find(c => c.id === asset.coin)?.name || asset.coin
          };
        }
        grouped[asset.coin].amount += asset.amount;
      });

      // Prepara dados para o gráfico
      const labels = Object.keys(grouped).map(coinId => grouped[coinId].name);
      const data = Object.keys(grouped).map(coinId => {
        return grouped[coinId].amount * grouped[coinId].buyPrice;
      });

      const backgroundColors = [
        '#00ff88', '#00cc6a', '#00994c',
        '#00662e', '#003319', '#00a55a',
        '#008548', '#006536'
      ];

      if (window.portfolioChart) {
        window.portfolioChart.destroy();
      }

      window.portfolioChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: 'var(--text)'
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return ` R$ ${context.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                }
              }
            }
          }
        }
      });
    }
  }

  // 12. ALERTAS DE PREÇO - NOVA CLASSE ADICIONADA
  class PriceAlerts {
    constructor() {
      this.alerts = JSON.parse(localStorage.getItem('priceAlerts')) || [];
      this.init();
    }

    init() {
      document.getElementById('addAlertBtn').addEventListener('click', () => this.showAddDialog());
      this.render();
      setInterval(() => this.checkAlerts(), 300000); // Verifica a cada 5 minutos
    }

    showAddDialog() {
      const currentCoin = document.getElementById('moedaSelect').value;
      Swal.fire({
        title: 'Criar Alerta',
        html: `
          <select id="swalAlertCoin" class="swal2-select">
            ${coins.map(c => `<option value="${c.id}" ${c.id === currentCoin ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
          <select id="swalAlertCondition" class="swal2-select">
            <option value="above">Acima de</option>
            <option value="below">Abaixo de</option>
          </select>
          <input type="number" id="swalAlertPrice" placeholder="Preço em R$" class="swal2-input" step="0.0001">
        `,
        confirmButtonText: 'Salvar',
        preConfirm: () => {
          return {
            coin: document.getElementById('swalAlertCoin').value,
            condition: document.getElementById('swalAlertCondition').value,
            price: parseFloat(document.getElementById('swalAlertPrice').value),
            id: Date.now()
          };
        }
      }).then(result => {
        if (result.isConfirmed) {
          this.addAlert(result.value);
        }
      });
    }

    addAlert(alert) {
      this.alerts.push(alert);
      this.save();
      this.render();
      Swal.fire('Sucesso!', 'Alerta criado com sucesso.', 'success');
    }

    async checkAlerts() {
      if (this.alerts.length === 0) return;

      const coinIds = [...new Set(this.alerts.map(a => a.coin))];
      const prices = await safeFetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=brl`);

      this.alerts.forEach(alert => {
        const currentPrice = prices[alert.coin]?.brl;
        if (!currentPrice) return;

        const isTriggered = (
          (alert.condition === 'above' && currentPrice >= alert.price) ||
          (alert.condition === 'below' && currentPrice <= alert.price)
        );

        if (isTriggered) {
          this.triggerAlert(alert, currentPrice);
        }
      });
    }

    triggerAlert(alert, currentPrice) {
      // Remove o alerta após disparar
      this.alerts = this.alerts.filter(a => a.id !== alert.id);
      this.save();
      this.render();

      // Notificação
      Swal.fire({
        title: 'Alerta Disparado!',
        html: `<b>${coins.find(c => c.id === alert.coin)?.name}</b> está <b>R$ ${currentPrice.toFixed(2)}</b><br>
               (${alert.condition === 'above' ? 'Acima' : 'Abaixo'} de R$ ${alert.price.toFixed(2)})`,
        icon: 'info',
        confirmButtonText: 'OK'
      });
    }

    render() {
      const container = document.getElementById('alertsContainer');
      container.innerHTML = this.alerts.length === 0
        ? '<p style="color:var(--text-muted); text-align:center;">Nenhum alerta ativo</p>'
        : this.alerts.map(alert => `
            <div class="alert-item">
              <div>
                <strong>${coins.find(c => c.id === alert.coin)?.name}</strong><br>
                <small>${alert.condition === 'above' ? 'Acima de' : 'Abaixo de'} R$ ${alert.price.toFixed(2)}</small>
              </div>
              <button onclick="alerts.removeAlert(${alert.id})" style="background:none; border:none; color:var(--error); cursor:pointer;">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `).join('');
    }

    removeAlert(id) {
      this.alerts = this.alerts.filter(a => a.id !== id);
      this.save();
      this.render();
    }

    save() {
      localStorage.setItem('priceAlerts', JSON.stringify(this.alerts));
    }
  }

  // 13. CALCULADORA DE TRADE - NOVA FUNÇÃO ADICIONADA
  window.calculateProfit = function () {
    const coin = document.getElementById('calcCoin').value;
    const amount = parseFloat(document.getElementById('calcAmount').value);
    const buyPrice = parseFloat(document.getElementById('calcBuyPrice').value);
    const sellPrice = parseFloat(document.getElementById('calcSellPrice').value);

    if (!amount || !buyPrice || !sellPrice) {
      Swal.fire('Erro', 'Preencha todos os campos!', 'error');
      return;
    }

    const profit = (sellPrice - buyPrice) * amount;
    const percentage = ((sellPrice / buyPrice) - 1) * 100;

    document.getElementById('calcProfit').innerHTML = `
      <strong>Lucro/Prejuízo:</strong> R$ ${profit.toFixed(2)} 
      <span style="color:${profit >= 0 ? '#00ff88' : '#ff4d4d'}">
        (${profit >= 0 ? '+' : ''}${profit.toFixed(2)})
      </span>
    `;

    document.getElementById('calcPercentage').innerHTML = `
      <strong>Variação:</strong> 
      <span style="color:${percentage >= 0 ? '#00ff88' : '#ff4d4d'}">
        ${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%
      </span>
    `;

    document.getElementById('calcResult').style.display = 'block';
  };

  // 14. MICROINTERAÇÕES
  function setupMicrointeractions() {
    // Atualização de dados
    document.querySelectorAll('[data-refresh]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.querySelector('i').classList.add('fa-spin');
        setTimeout(() => {
          btn.querySelector('i').classList.remove('fa-spin');
        }, 1000);
      });
    });

    // Efeito de hover em cards
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 10px 20px rgba(0, 255, 136, 0.2)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  }

  // 15. SEÇÃO EDUCATIVA
  function setupEducativa() {
    // Dados do glossário
    const glossario = [
      {
        termo: "Blockchain",
        definicao: "Tecnologia de registro distribuído que mantém registros permanentes e à prova de violação de dados."
      },
      {
        termo: "Wallet",
        definicao: "Carteira digital usada para armazenar, enviar e receber criptomoedas."
      },
      {
        termo: "DeFi",
        definicao: "Sistemas financeiros descentralizados que operam tanpa intermediários como bancos."
      },
      {
        termo: "NFT",
        definicao: "Token não fungível que representa propriedade de um item digital único."
      },
      {
        termo: "Smart Contract",
        definicao: "Contrato auto-executável com termos escritos em código de programação."
      },
      {
        termo: "Stablecoin",
        definicao: "Criptomoeda atrelada a um ativo estável como o dólar americano."
      }
    ];

    // Dados dos tutoriais
    const tutoriais = [
      {
        titulo: "Como Criar sua Primeira Carteira",
        descricao: "Guia passo a passo para configurar uma carteira de criptomoedas segura.",
        dificuldade: "Iniciante",
        tempo: "5 min"
      },
      {
        titulo: "Primeira Compra de Bitcoin",
        descricao: "Aprenda a comprar seu primeiro Bitcoin em uma exchange confiável.",
        dificuldade: "Iniciante",
        tempo: "10 min"
      },
      {
        titulo: "Segurança Avançada para Carteiras",
        descricao: "Técnicas profissionais para proteger seus ativos digitais.",
        dificuldade: "Avançado",
        tempo: "15 min"
      }
    ];

    // Carrega o glossário
    const glossarioContent = document.getElementById('glossarioContent');
    glossario.forEach(termo => {
      glossarioContent.innerHTML += `
        <div class="termo-card">
          <h3>${termo.termo}</h3>
          <p>${termo.definicao}</p>
        </div>
      `;
    });

    // Carrega os tutoriais
    const tutoriaisContent = document.getElementById('tutoriaisContent');
    tutoriais.forEach(tutorial => {
      tutoriaisContent.innerHTML += `
        <div class="tutorial-card" onclick="openTutorial('${tutorial.titulo}')">
          <span class="dificuldade">${tutorial.dificuldade}</span>
          <h3>${tutorial.titulo}</h3>
          <p>${tutorial.descricao}</p>
          <div class="tempo"><i class="far fa-clock"></i> ${tutorial.tempo}</div>
        </div>
      `;
    });

    // Busca no glossário
    document.getElementById('glossarioSearch').addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const cards = document.querySelectorAll('.termo-card');

      cards.forEach(card => {
        const termo = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = termo.includes(searchTerm) ? 'block' : 'none';
      });
    });
  }

  // Funções para abrir abas e tutoriais
  function openTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabContents.forEach(tab => {
      tab.style.display = 'none';
    });

    tabButtons.forEach(btn => {
      btn.classList.remove('active');
    });

    document.getElementById(tabName).style.display = 'block';
    event.currentTarget.classList.add('active');
  }

  function openTutorial(title) {
    alert(`Abrindo tutorial: ${title}\n\nEsta funcionalidade pode ser expandida para mostrar um modal ou página detalhada.`);
  }

  // 16. THEME TOGGLE
  function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');

    // Verifica o tema salvo ou preferência do sistema
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', initialTheme);
    updateToggleIcon(initialTheme);

    // Alterna entre temas
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateToggleIcon(newTheme);
    });

    function updateToggleIcon(theme) {
      if (theme === 'dark') {
        icon.className = 'fas fa-sun';
      } else {
        icon.className = 'fas fa-moon';
      }
    }
  }

  // 17. INICIALIZAÇÃO COMPLETA
  async function initApp() {
    setupThemeToggle();
    await updateCryptoData();
    await updateAdvancedMetrics();
    await updateFearGreed();
    await initChart();
    setupChat();
    loadNews();

    // Inicializa novas funcionalidades
    window.portfolio = new PortfolioSimulator();
    window.alerts = new PriceAlerts(); // Inicializa os alertas
    MarketIndices.init();
    setupMicrointeractions();
    setupEducativa();
    setupRiskCalculator();

    // Configura listeners para atualização quando a moeda é alterada
    document.getElementById('moedaSelect').addEventListener('change', async () => {
      await updateCryptoData();
      await updateAdvancedMetrics();
      await initChart();
    });

    // Atualizações periódicas
    setInterval(updateCryptoData, 300000); // 5 minutos
    setInterval(updateFearGreed, 3600000); // 1 hora

    console.log("TrackCripto totalmente carregado!");
  }

  // Inicia o aplicativo
  initApp();
});

// Ativa animações ao rolar
document.addEventListener('DOMContentLoaded', () => {
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.slide-up');
    elements.forEach(el => {
      const elTop = el.getBoundingClientRect().top;
      if (elTop < window.innerHeight * 0.8) {
        el.classList.add('animated');
      }
    });
  };

  window.addEventListener('scroll', animateOnScroll);
  animateOnScroll(); // Executa ao carregar
});

// Botão "voltar ao topo"
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // Mostra o botão apenas se o usuário estiver a 200px do fim da página
  if (scrollTop + windowHeight >= documentHeight - 200) {
    backToTopBtn.classList.add('visible');
  } else {
    backToTopBtn.classList.remove('visible');
  }
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    mainNav.classList.toggle('active');
    document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
  });

  document.querySelectorAll('.main-nav a').forEach(a => {
    a.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      mainNav.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
});

// ==============================================
// 🔥 CÓDIGO CORRIGIDO - TEMA + MODO
// ==============================================

// Configuração do Toggle de Tema (Claro/Escuro) - VERSÃO CORRIGIDA
function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) {
    console.log('Botão de tema não encontrado!');
    return;
  }

  // Verificar se já existe um event listener (evitar duplicata)
  themeToggle.replaceWith(themeToggle.cloneNode(true));
  const newThemeToggle = document.getElementById('themeToggle');

  // Verificar preferência salva ou do sistema
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  // Aplicar tema inicial
  document.documentElement.setAttribute('data-theme', initialTheme);
  updateToggleIcon(initialTheme);

  // Alternar tema - USANDO O NOVO ELEMENTO (sem duplicatas)
  newThemeToggle.addEventListener('click', function () {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    console.log('Alternando tema para:', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleIcon(newTheme);
  });

  function updateToggleIcon(theme) {
    const icon = newThemeToggle.querySelector('i');
    if (!icon) return;

    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
      newThemeToggle.setAttribute('aria-label', 'Alternar para modo claro');
    } else {
      icon.className = 'fas fa-moon';
      newThemeToggle.setAttribute('aria-label', 'Alternar para modo escuro');
    }
  }
}

// Configuração do Toggle de Modo Iniciante/Avançado
function setupAdvancedModeToggle() {
  const modeToggle = document.getElementById('advancedModeToggle');
  if (!modeToggle) return;

  const modeText = document.getElementById('modeText');
  const advancedSections = document.querySelectorAll('.advanced-mode');

  function loadModePreference() {
    const savedMode = localStorage.getItem('advancedMode') === 'true';
    modeToggle.checked = savedMode;
    updateModeDisplay(savedMode);
  }

  function updateModeDisplay(isAdvanced) {
    if (isAdvanced) {
      advancedSections.forEach(section => {
        section.style.display = 'block';
        section.classList.add('fade-in');
      });
      if (modeText) modeText.textContent = 'Avançado';
    } else {
      advancedSections.forEach(section => {
        section.style.display = 'none';
      });
      if (modeText) modeText.textContent = 'Iniciante';
    }
  }

  modeToggle.addEventListener('change', function () {
    const isAdvanced = this.checked;
    localStorage.setItem('advancedMode', isAdvanced);
    updateModeDisplay(isAdvanced);
  });

  loadModePreference();
}

// Adicionar animação de fade-in
const style = document.createElement('style');
style.textContent = `
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);

// Inicializar TUDO - COM PROTECÇÃO CONTRA DUPLICATAS
let initialized = false;
function initializeAll() {
  if (initialized) return;
  initialized = true;

  console.log('Inicializando controles...');
  setupThemeToggle();
  setupAdvancedModeToggle();
}

// Múltiplas formas de inicializar para garantir
document.addEventListener('DOMContentLoaded', initializeAll);
window.addEventListener('load', initializeAll);
setTimeout(initializeAll, 1000); // Backup

// ==============================================
// 🎮 QUIZ INTERATIVO - PERFIL DO INVESTIDOR
// ==============================================

class CryptoQuiz {
  constructor() {
    this.currentQuestion = 1;
    this.totalQuestions = 3;
    this.answers = [];
    this.quizElement = document.getElementById('quizModal');
    this.resultElement = document.getElementById('quizResult');

    this.init();
  }

  init() {
    this.bindEvents();
    this.showQuiz();
  }

  bindEvents() {
    // Opções de resposta
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectOption(e));
    });

    // Navegação
    document.getElementById('prevQuestion').addEventListener('click', () => this.prevQuestion());
    document.getElementById('nextQuestion').addEventListener('click', () => this.nextQuestion());

    // Resultado
    document.getElementById('startDashboard').addEventListener('click', () => this.startDashboard());
    document.getElementById('changeMode').addEventListener('click', () => this.changeMode());
  }

  showQuiz() {
    if (localStorage.getItem('quizCompleted')) return;

    setTimeout(() => {
      this.quizElement.style.display = 'flex';
      this.updateProgress();
      this.updateNavigation();
    }, 1000);
  }

  selectOption(e) {
    const option = e.currentTarget;
    const value = option.dataset.value;

    // Remover seleção anterior
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.style.background = '';
      btn.style.borderColor = '';
    });

    // Estilizar opção selecionada
    option.style.background = 'rgba(0, 255, 136, 0.3)';
    option.style.borderColor = '#00ff88';

    // Salvar resposta
    this.answers[this.currentQuestion - 1] = value;

    // Habilitar próximo
    document.getElementById('nextQuestion').disabled = false;
  }

  nextQuestion() {
    if (this.currentQuestion < this.totalQuestions) {
      this.hideQuestion(this.currentQuestion);
      this.currentQuestion++;
      this.showQuestion(this.currentQuestion);
      this.updateProgress();
      this.updateNavigation();
    } else {
      this.showResult();
    }
  }

  prevQuestion() {
    if (this.currentQuestion > 1) {
      this.hideQuestion(this.currentQuestion);
      this.currentQuestion--;
      this.showQuestion(this.currentQuestion);
      this.updateProgress();
      this.updateNavigation();
    }
  }

  showQuestion(questionNum) {
    const question = document.querySelector(`[data-question="${questionNum}"]`);
    question.classList.add('active');
    question.style.display = 'block';
  }

  hideQuestion(questionNum) {
    const question = document.querySelector(`[data-question="${questionNum}"]`);
    question.classList.remove('active');
    question.style.display = 'none';
  }

  updateProgress() {
    const progress = (this.currentQuestion / this.totalQuestions) * 100;
    document.querySelector('.progress-fill').style.width = `${progress}%`;
    document.querySelector('.question-counter').textContent = `${this.currentQuestion}/${this.totalQuestions}`;
  }

  updateNavigation() {
    document.getElementById('prevQuestion').disabled = this.currentQuestion === 1;
    document.getElementById('nextQuestion').disabled = !this.answers[this.currentQuestion - 1];
  }

  showResult() {
    const profile = this.calculateProfile();

    // Animação de transição
    this.quizElement.style.animation = 'modalSlideOut 0.5s ease-in forwards';

    setTimeout(() => {
      this.quizElement.style.display = 'none';
      this.displayResult(profile);
      this.resultElement.style.display = 'flex';
    }, 500);
  }

  calculateProfile() {
    const beginnerAnswers = this.answers.filter(a => a === 'beginner').length;
    const advancedAnswers = this.answers.filter(a => a === 'advanced').length;

    return advancedAnswers > beginnerAnswers ? 'advanced' : 'beginner';
  }

  displayResult(profile) {
    const results = {
      beginner: {
        icon: '🌱',
        title: 'Explorador Iniciante!',
        description: 'Você está começando sua jornada no mundo cripto. Vamos devagar e sempre!',
        profileName: 'Broto Crypto'
      },
      advanced: {
        icon: '🚀',
        title: 'Trader Acelerado!',
        description: 'Você já domina as criptomoedas! Prepare-se para análise profunda.',
        profileName: 'Tubarão das Criptos'
      }
    };

    const result = results[profile];

    document.getElementById('resultIcon').textContent = result.icon;
    document.getElementById('resultTitle').textContent = result.title;
    document.getElementById('resultDescription').textContent = result.description;
    document.getElementById('resultProfileName').textContent = result.profileName;

    // Aplicar modo automaticamente
    localStorage.setItem('userProfile', profile);
    localStorage.setItem('quizCompleted', 'true');

    if (profile === 'advanced') {
      document.getElementById('advancedModeToggle').checked = true;
      this.updateModeDisplay(true);
    }
  }

  updateModeDisplay(isAdvanced) {
    const advancedSections = document.querySelectorAll('.advanced-mode');
    const modeText = document.getElementById('modeText');

    if (isAdvanced) {
      advancedSections.forEach(section => {
        section.style.display = 'block';
        section.classList.add('fade-in');
      });
      if (modeText) modeText.textContent = 'Avançado';
    } else {
      advancedSections.forEach(section => {
        section.style.display = 'none';
      });
      if (modeText) modeText.textContent = 'Iniciante';
    }
  }

  startDashboard() {
    this.resultElement.style.animation = 'resultScaleOut 0.5s ease-in forwards';

    setTimeout(() => {
      this.resultElement.style.display = 'none';
      // Focar no conteúdo principal
      document.getElementById('crypto-data').scrollIntoView({
        behavior: 'smooth'
      });
    }, 500);
  }

  changeMode() {
    this.resultElement.style.display = 'none';
    this.quizElement.style.display = 'flex';
    this.quizElement.style.animation = 'modalSlideIn 0.5s ease-out';

    // Resetar quiz
    this.currentQuestion = 1;
    this.answers = [];
    this.hideQuestion(2);
    this.hideQuestion(3);
    this.showQuestion(1);
    this.updateProgress();
    this.updateNavigation();

    // Limpar seleções
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.style.background = '';
      btn.style.borderColor = '';
    });
  }
}

// Adicionar animações extras
const quizStyles = `
@keyframes modalSlideOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
}

@keyframes resultScaleOut {
  from {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
  to {
    opacity: 0;
    transform: scale(0.8) rotate(5deg);
  }
}

.option-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = quizStyles;
document.head.appendChild(styleSheet);

// Inicializar quiz quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  // Só inicializar se não completou o quiz
  if (!localStorage.getItem('quizCompleted')) {
    setTimeout(() => {
      new CryptoQuiz();
    }, 2000);
  }
});

// Controle do menu de navegação
function setupNavigationMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const mainNav = document.getElementById('mainNav');
    const navOverlay = document.createElement('div');
    const navModeToggle = document.getElementById('navModeToggle');
    const navThemeToggle = document.getElementById('navThemeToggle');
    const mainModeToggle = document.getElementById('advancedModeToggle');
    const mainThemeToggle = document.getElementById('themeToggle');
    
    // Criar overlay
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);
    
    // Verificar se os elementos existem
    if (!menuToggle || !mainNav) {
        console.error('Elementos do menu não encontrados!');
        return;
    }
    
    // Abrir menu
    menuToggle.addEventListener('click', () => {
        mainNav.classList.add('active');
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Fechar menu
    function closeNavigationMenu() {
        mainNav.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (closeMenu) {
        closeMenu.addEventListener('click', closeNavigationMenu);
    }
    
    navOverlay.addEventListener('click', closeNavigationMenu);
    
    // Fechar menu ao clicar em um link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(closeNavigationMenu, 300);
        });
    });
    
    // Sincronizar toggle do modo
    if (navModeToggle && mainModeToggle) {
        // Sincronizar estado inicial
        navModeToggle.checked = mainModeToggle.checked;
        
        // Quando alterar no menu
        navModeToggle.addEventListener('change', () => {
            mainModeToggle.checked = navModeToggle.checked;
            // Disparar evento de change manualmente
            const event = new Event('change');
            mainModeToggle.dispatchEvent(event);
            
            // Atualizar a interface
            updateModeDisplay(mainModeToggle.checked);
        });
        
        // Quando alterar no header
        mainModeToggle.addEventListener('change', () => {
            navModeToggle.checked = mainModeToggle.checked;
        });
    }
    
    // Sincronizar toggle do tema
    if (navThemeToggle && mainThemeToggle) {
        // Atualizar ícone inicial
        updateThemeIcon();
        
        navThemeToggle.addEventListener('click', () => {
            mainThemeToggle.click();
            // Pequeno delay para garantir que o tema foi alterado
            setTimeout(updateThemeIcon, 100);
        });
    }
    
    // Função para atualizar o ícone do tema
    function updateThemeIcon() {
        if (!navThemeToggle) return;
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        navThemeToggle.innerHTML = isDark ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
    
    // Função para atualizar a exibição do modo
    function updateModeDisplay(isAdvanced) {
        const advancedSections = document.querySelectorAll('.advanced-mode');
        const modeText = document.getElementById('modeText');
        
        if (isAdvanced) {
            advancedSections.forEach(section => {
                section.style.display = 'block';
                section.classList.add('fade-in');
            });
            if (modeText) modeText.textContent = 'Avançado';
        } else {
            advancedSections.forEach(section => {
                section.style.display = 'none';
            });
            if (modeText) modeText.textContent = 'Iniciante';
        }
    }
}

// Inicializar menu quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    setupNavigationMenu();
    
    // Adicionar classe para animação de entrada dos itens
    setTimeout(() => {
        const navItems = document.querySelectorAll('.nav-links li');
        navItems.forEach((item, index) => {
            item.style.animationDelay = `${0.1 + (index * 0.05)}s`;
        });
    }, 500);
});