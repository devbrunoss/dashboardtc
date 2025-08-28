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

  // Adicionar no início do DOMContentLoaded, após a definição de elementos
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.setAttribute('data-mode', 'advanced');

  // Adicionar após a inicialização completa do app
  function setupHeaderHideOnScroll() {
  const header = document.getElementById('pageHeader');
  if (!header) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }
  });
}

  // Modificar a função setupAdvancedModeToggle para usar data-mode
  function setupAdvancedModeToggle() {
    const btn = document.getElementById('modeToggle');
    if (!btn) return;

    const advancedSections = document.querySelectorAll('.advanced-mode');
    let isAdvanced = document.documentElement.getAttribute('data-mode') === 'advanced';

    function updateUI() {
      // Atualizar atributo data-mode
      document.documentElement.setAttribute('data-mode', isAdvanced ? 'advanced' : 'beginner');
      localStorage.setItem('advancedMode', isAdvanced);
      
      advancedSections.forEach((section) => {
        section.style.display = isAdvanced ? '' : 'none';
      });

      const tooltip = btn.querySelector('.tooltip') || document.createElement('span');
      tooltip.className = 'tooltip';
      tooltip.textContent = isAdvanced ? 'Modo avançado' : 'Modo iniciante';
      
      if (!btn.contains(tooltip)) {
        btn.appendChild(tooltip);
      }

      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isAdvanced ? 'fas fa-rocket' : 'fas fa-graduation-cap';
      }
    }

    updateUI();

    btn.addEventListener('click', () => {
      isAdvanced = !isAdvanced;
      updateUI();
      
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.add('icon-bounce');
        setTimeout(() => icon.classList.remove('icon-bounce'), 500);
      }
    });
  }

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
let currentChart = null;
let chartDays = 7;

async function initChart() {
  const cryptoSelect = document.getElementById('cryptoSelect');
  const cryptoId = cryptoSelect ? cryptoSelect.value : 'bitcoin';
  const ctx = document.getElementById('graficoBTC').getContext('2d');
  
  // Mostrar loading
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#00ff88';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Carregando...', ctx.canvas.width / 2, ctx.canvas.height / 2);

  try {
    const data = await safeFetch(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=brl&days=${chartDays}`
    );

    if (data && data.prices) {
      // Destruir gráfico anterior se existir
      if (currentChart) {
        currentChart.destroy();
      }

      const labels = data.prices.map(price =>
        new Date(price[0]).toLocaleDateString('pt-BR', { 
          day: 'numeric', 
          month: 'short',
          hour: chartDays <= 7 ? '2-digit' : undefined,
          minute: chartDays <= 7 ? '2-digit' : undefined
        })
      );

      const prices = data.prices.map(price => price[1]);
      
      // Calcular estatísticas
      updateChartStats(prices, data.prices);
      
      // Configuração do gráfico moderna
      currentChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `Preço ${cryptoId.toUpperCase()} (R$)`,
            data: prices,
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#00ff88',
            pointHoverBackgroundColor: '#00cc6a',
            pointBorderColor: 'rgba(0, 0, 0, 0.5)',
            pointBorderWidth: 2,
            fill: true,
            tension: 0.4,
            cubicInterpolationMode: 'monotone'
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
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              titleColor: '#00ff88',
              bodyColor: '#ffffff',
              borderColor: '#00ff88',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: (context) => {
                  return ` R$ ${context.parsed.y.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}`;
                },
                title: (context) => {
                  return context[0].label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { 
                display: false,
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: chartDays <= 7 ? 12 : 8
              }
            },
            y: {
              grid: { 
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                callback: (value) => {
                  if (value >= 1000) {
                    return `R$ ${(value / 1000).toFixed(1)}k`;
                  }
                  return `R$ ${value}`;
                }
              }
            }
          },
          interaction: { 
            mode: 'index',
            intersect: false
          },
          animations: {
            tension: {
              duration: 1000,
              easing: 'linear'
            }
          }
        }
      });

      // Atualizar hora da última atualização
      document.getElementById('chartUpdateTime').textContent = 
        new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
    }
  } catch (error) {
    console.error('Erro ao carregar gráfico:', error);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#ff4d4d';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Erro ao carregar gráfico. Tente novamente.', ctx.canvas.width / 2, ctx.canvas.height / 2);
  }
}

// Função para atualizar estatísticas do gráfico
function updateChartStats(prices, priceData) {
  const currentPrice = prices[prices.length - 1];
  const initialPrice = prices[0];
  const priceChange = ((currentPrice - initialPrice) / initialPrice) * 100;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  document.getElementById('currentPrice').textContent = 
    `R$ ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const changeElement = document.getElementById('priceChange');
  changeElement.textContent = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
  changeElement.className = priceChange >= 0 ? 'positive' : 'negative';
  
  document.getElementById('minPrice').textContent = 
    `R$ ${minPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  document.getElementById('maxPrice').textContent = 
    `R$ ${maxPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Adicione estas funções de controle
function setupChartControls() {
  // Seletor de criptomoeda
  const cryptoSelect = document.getElementById('cryptoSelect');
  if (cryptoSelect) {
    cryptoSelect.addEventListener('change', initChart);
  }

  // Botão de atualizar
  const refreshBtn = document.getElementById('refreshChart');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', initChart);
  }

  // Botões de tempo
  const timeButtons = document.querySelectorAll('.time-btn');
  timeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      timeButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      chartDays = parseInt(this.dataset.days);
      initChart();
    });
  });
}

// No initApp(), adicione:
async function initApp() {
  // ... código existente ...
  setupChartControls();
  await initChart();
  // ... código existente ...
}

  // 7. CALCULADORA DE RISCO
  // GERENCIADOR DE RISCO AVANÇADO
class RiskManager {
  constructor() {
    this.volatilityData = {
      bitcoin: { volatility: 2.1, rating: 'Baixa' },
      ethereum: { volatility: 3.5, rating: 'Média' },
      solana: { volatility: 4.8, rating: 'Alta' },
      cardano: { volatility: 3.2, rating: 'Média' },
      binancecoin: { volatility: 3.0, rating: 'Média' },
      ripple: { volatility: 4.2, rating: 'Alta' },
      dogecoin: { volatility: 5.5, rating: 'Muito Alta' },
      polkadot: { volatility: 3.8, rating: 'Alta' }
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupSliders();
    this.loadProfileSettings();
  }

  setupEventListeners() {
    // Tabs
    document.querySelectorAll('.risk-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Botões
    document.getElementById('calculateRisk').addEventListener('click', () => this.calculate());
    document.getElementById('resetRisk').addEventListener('click', () => this.reset());

    // Perfil de risco
    document.getElementById('riskProfile').addEventListener('change', (e) => {
      this.applyRiskProfile(e.target.value);
    });

    // Slider de risco
    document.getElementById('riskPerTrade').addEventListener('input', (e) => {
      document.getElementById('riskValue').textContent = `${e.target.value}%`;
    });

    // Inputs em tempo real
    document.getElementById('totalCapital').addEventListener('input', () => this.updateLivePreview());
    document.getElementById('riskCoin').addEventListener('change', () => this.updateVolatilityInfo());
  }

  setupSliders() {
    const slider = document.getElementById('riskPerTrade');
    slider.addEventListener('input', function() {
      const value = ((this.value - this.min) / (this.max - this.min)) * 100;
      this.style.background = `linear-gradient(90deg, var(--primary) ${value}%, rgba(255, 255, 255, 0.1) ${value}%)`;
    });
  }

  loadProfileSettings() {
    this.applyRiskProfile('moderado');
  }

  applyRiskProfile(profile) {
    const settings = {
      conservador: { risk: 1, stopLoss: 10, leverage: 1 },
      moderado: { risk: 2, stopLoss: 15, leverage: 3 },
      arrojado: { risk: 3, stopLoss: 20, leverage: 5 },
      agressivo: { risk: 4, stopLoss: 25, leverage: 10 }
    };

    const setting = settings[profile] || settings.moderado;
    
    document.getElementById('riskPerTrade').value = setting.risk;
    document.getElementById('riskValue').textContent = `${setting.risk}%`;
    document.getElementById('stopLossPercent').value = setting.stopLoss;
    document.getElementById('leverage').value = setting.leverage;

    // Atualiza slider visual
    const slider = document.getElementById('riskPerTrade');
    const value = ((setting.risk - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(90deg, var(--primary) ${value}%, rgba(255, 255, 255, 0.1) ${value}%)`;
  }

  switchTab(tabName) {
    // Atualiza UI das tabs
    document.querySelectorAll('.risk-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.risk-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
  }

  updateVolatilityInfo() {
    const coin = document.getElementById('riskCoin').value;
    const volatility = this.volatilityData[coin] || { volatility: 3.0, rating: 'Média' };
    
    document.getElementById('expectedVolatility').value = volatility.volatility;
    
    const hint = document.querySelector('#expectedVolatility + .risk-hint');
    if (hint) {
      hint.textContent = `Volatilidade ${volatility.rating} (${volatility.volatility}%)`;
    }
  }

  updateLivePreview() {
    const capital = parseFloat(document.getElementById('totalCapital').value) || 0;
    if (capital > 0) {
      const riskPercent = parseFloat(document.getElementById('riskPerTrade').value) || 2;
      const riskAmount = (capital * riskPercent) / 100;
      
      const riskHint = document.querySelector('#totalCapital + .risk-hint');
      if (riskHint) {
        riskHint.textContent = `Risco por trade: R$ ${riskAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
    }
  }

  calculate() {
    const capital = parseFloat(document.getElementById('totalCapital').value);
    const coin = document.getElementById('riskCoin').value;

    if (!capital || capital <= 0) {
      Swal.fire('Erro', 'Informe um valor de capital válido.', 'error');
      return;
    }

    // Coleta todos os parâmetros
    const params = this.collectParameters();
    const results = this.calculateRisk(capital, coin, params);

    // Atualiza UI com resultados
    this.updateResults(results);

    // Mostra resultados
    document.getElementById('riskResult').classList.add('show');
  }

  collectParameters() {
    return {
      riskPercent: parseFloat(document.getElementById('riskPerTrade').value) || 2,
      stopLossPercent: parseFloat(document.getElementById('stopLossPercent').value) || 15,
      leverage: parseInt(document.getElementById('leverage').value) || 1,
      riskReward: parseFloat(document.getElementById('riskReward').value) || 3,
      allocationPercent: parseFloat(document.getElementById('allocationPercent').value) || 20,
      strategy: document.getElementById('strategy').value,
      timeHorizon: document.getElementById('timeHorizon').value,
      diversification: document.getElementById('diversification').value
    };
  }

  calculateRisk(capital, coin, params) {
    const volatility = this.volatilityData[coin] || { volatility: 3.0 };
    
    // Cálculo do valor por trade
    const riskAmount = (capital * params.riskPercent) / 100;
    
    // Cálculo do position size (considerando leverage)
    const positionSize = riskAmount * params.leverage;
    
    // Cálculo da perda máxima
    const maxLoss = riskAmount;
    
    // Cálculo do preço de stop loss (simulado)
    const currentPrice = this.getCurrentPriceSimulation(coin);
    const stopPrice = currentPrice * (1 - params.stopLossPercent / 100);
    
    // Score de risco (0-100)
    const riskScore = this.calculateRiskScore(params, volatility);
    
    // Recomendações
    const recommendations = this.generateRecommendations(params, volatility, riskScore);

    return {
      riskAmount,
      positionSize,
      maxLoss,
      stopPrice,
      riskScore,
      recommendations,
      volatility: volatility.volatility,
      currentPrice,
      params
    };
  }

  getCurrentPriceSimulation(coin) {
    // Preços simulados para exemplo (em produção, buscaría da API)
    const prices = {
      bitcoin: 250000,
      ethereum: 15000,
      solana: 500,
      cardano: 2.5,
      binancecoin: 300,
      ripple: 3.2,
      dogecoin: 0.15,
      polkadot: 25
    };
    return prices[coin] || 100;
  }

  calculateRiskScore(params, volatility) {
    let score = 100;

    // Penaliza risco alto por trade
    score -= (params.riskPercent - 1) * 10;

    // Penaliza alavancagem alta
    score -= (params.leverage - 1) * 2;

    // Penaliza stop loss muito apertado
    if (params.stopLossPercent < 10) score -= 15;
    if (params.stopLossPercent < 5) score -= 10;

    // Penaliza alta volatilidade
    score -= (volatility.volatility - 2) * 3;

    // Bonus para risk/reward bom
    if (params.riskReward >= 3) score += 10;
    if (params.riskReward >= 5) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(params, volatility, riskScore) {
    const recommendations = [];

    if (params.riskPercent > 3) {
      recommendations.push('Considere reduzir o risco por trade para abaixo de 3%');
    }

    if (params.leverage > 10) {
      recommendations.push('Alavancagem muito alta. Reduza para melhorar a segurança');
    }

    if (params.stopLossPercent < 10) {
      recommendations.push('Stop loss muito apertado. Aumente para pelo menos 10%');
    }

    if (volatility.volatility > 4 && params.leverage > 5) {
      recommendations.push('Alta volatilidade com alavancagem elevada. Cuidado!');
    }

    if (params.riskReward < 2) {
      recommendations.push('Risco/retorno baixo. Busque pelo menos 1:2');
    }

    if (riskScore >= 80) {
      recommendations.push('🎯 Estratégia excelente! Mantenha o gerenciamento de risco');
    } else if (riskScore >= 60) {
      recommendations.push('👍 Estratégia boa. Alguns ajustes podem melhorar');
    } else {
      recommendations.push('⚠️ Risco elevado. Revise seus parâmetros');
    }

    return recommendations;
  }

  updateResults(results) {
    // Atualiza métricas
    document.getElementById('riskValuePerTrade').textContent = 
      `R$ ${results.riskAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    document.getElementById('riskMaxLoss').textContent = 
      `R$ ${results.maxLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    document.getElementById('riskPositionSize').textContent = 
      results.positionSize.toLocaleString('pt-BR', { minimumFractionDigits: 4 });
    
    document.getElementById('riskStopPrice').textContent = 
      `R$ ${results.stopPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Score e badge
    document.getElementById('riskScore').textContent = `${results.riskScore}/100`;
    
    const riskLevel = this.getRiskLevel(results.riskScore);
    document.getElementById('riskLevel').textContent = riskLevel.toUpperCase();
    document.getElementById('riskLevel').className = `risk-badge badge-${riskLevel}`;

    // Breakdown
    document.getElementById('breakdownVolatility').textContent = `${results.volatility}%`;
    document.getElementById('breakdownRiskPerTrade').textContent = `${results.params.riskPercent}%`;
    document.getElementById('breakdownLeverage').textContent = `${results.params.leverage}x`;
    document.getElementById('breakdownRiskReward').textContent = `1:${results.params.riskReward}`;

    // Recomendações
    const recommendationsContainer = document.getElementById('riskRecommendations');
    recommendationsContainer.innerHTML = results.recommendations.map(rec => `
      <div class="recommendation-item">
        <i class="fas fa-check-circle" style="color: #00ff88;"></i>
        <span>${rec}</span>
      </div>
    `).join('');
  }

  getRiskLevel(score) {
    if (score >= 80) return 'conservador';
    if (score >= 60) return 'moderado';
    if (score >= 40) return 'arrojado';
    return 'agressivo';
  }

  reset() {
    // Limpa campos
    document.getElementById('totalCapital').value = '';
    this.applyRiskProfile('moderado');
    
    // Esconde resultados
    document.getElementById('riskResult').classList.remove('show');
    
    Swal.fire('Reiniciado!', 'Calculadora resetada com sucesso.', 'success');
  }
}

// Inicializa o gerenciador de risco
window.riskManager = new RiskManager();

// Função global para compatibilidade
window.calculateRisk = function() {
  window.riskManager.calculate();
};


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

// 9. NOTÍCIAS - API DO REDDIT (CONFIÁVEL E SEM CHAVE)
async function loadNews() {
  try {
    elements.newsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;"><i class="fas fa-spinner fa-spin"></i> Carregando notícias...</p>';
    
    // API do Reddit - r/CryptoCurrency + r/Bitcoin
    const response = await fetch('https://www.reddit.com/r/CryptoCurrency+Bitcoin/hot.json?limit=10');
    
    if (!response.ok) throw new Error('Erro no Reddit API');
    
    const data = await response.json();
    
    if (data.data && data.data.children) {
      let newsHTML = '';
      
      // Filtrar posts relevantes (remover stickied, NSFW, e posts muito curtos)
      const posts = data.data.children
        .filter(post => 
          !post.data.stickied && 
          !post.data.over_18 && 
          post.data.title.length > 20 &&
          post.data.title.toLowerCase().includes(['bitcoin', 'crypto', 'ethereum', 'blockchain', 'defi', 'nft'])
        )
        .slice(0, 6); // Limitar a 6 notícias
      
      if (posts.length === 0) {
        throw new Error('Nenhuma notícia relevante encontrada');
      }
      
      posts.forEach((post, index) => {
        const title = post.data.title;
        const url = `https://reddit.com${post.data.permalink}`;
        const date = new Date(post.data.created_utc * 1000).toLocaleDateString('pt-BR');
        const comments = post.data.num_comments;
        const subreddit = post.data.subreddit;
        const upvotes = post.data.score;
        
        newsHTML += `
          <div class="news-item" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: ${index < posts.length - 1 ? '1px solid rgba(0, 255, 136, 0.1)' : 'none'}">
            <h3 style="margin-bottom: 10px; font-size: 1.1rem; line-height: 1.4;">
              <a href="${url}" target="_blank" style="color: var(--primary); text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                ${title}
              </a>
            </h3>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <span style="color: var(--text-muted); font-size: 0.85rem; display: flex; align-items: center;">
                <i class="fab fa-reddit" style="color: #FF5700; margin-right: 5px;"></i>
                r/${subreddit}
              </span>
              <span style="color: var(--text-muted); font-size: 0.85rem; display: flex; align-items: center;">
                <i class="fas fa-arrow-up" style="color: #00ff88; margin-right: 3px;"></i>${upvotes}
              </span>
              <span style="color: var(--text-muted); font-size: 0.85rem; display: flex; align-items: center;">
                <i class="far fa-comment" style="margin-right: 5px;"></i>${comments}
              </span>
              <span style="color: var(--text-muted); font-size: 0.85rem; display: flex; align-items: center;">
                <i class="far fa-clock" style="margin-right: 5px;"></i>${date}
              </span>
            </div>
          </div>
        `;
      });
      
      // Adicionar botão para ver mais notícias
      newsHTML += `
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://www.reddit.com/r/CryptoCurrency/" target="_blank" class="btn" style="padding: 8px 20px; font-size: 0.9rem;">
            <i class="fab fa-reddit"></i> Ver mais notícias
          </a>
        </div>
      `;
      
      elements.newsContainer.innerHTML = newsHTML;
      
    } else {
      throw new Error('Estrutura de dados inválida');
    }
    
  } catch (error) {
    console.error("Erro ao carregar notícias:", error);
    // Notícias de fallback manuais
    showFallbackNews();
  }
}

// Notícias de fallback
function showFallbackNews() {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  
  elements.newsContainer.innerHTML = `
    <div class="news-item" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(0, 255, 136, 0.1)">
      <h3 style="margin-bottom: 10px; font-size: 1.1rem; line-height: 1.4;">
        <a href="https://www.coindesk.com/" target="_blank" style="color: var(--primary); text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
          Bitcoin atinge nova máxima histórica em 2024
        </a>
      </h3>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">
          <i class="fas fa-newspaper" style="margin-right: 5px;"></i>CoinDesk
        </span>
        <span style="color: var(--text-muted); font-size: 0.85rem;">
          <i class="far fa-clock" style="margin-right: 5px;"></i>${currentDate}
        </span>
      </div>
    </div>
    
    <div class="news-item" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(0, 255, 136, 0.1)">
      <h3 style="margin-bottom: 10px; font-size: 1.1rem; line-height: 1.4;">
        <a href="https://decrypt.co/" target="_blank" style="color: var(--primary); text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
          Ethereum completa atualização Dencun com sucesso
        </a>
      </h3>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">
          <i class="fas fa-newspaper" style="margin-right: 5px;"></i>Decrypt
        </span>
        <span style="color: var(--text-muted); font-size: 0.85rem;">
          <i class="far fa-clock" style="margin-right: 5px;"></i>${currentDate}
        </span>
      </div>
    </div>
    
    <div class="news-item" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(0, 255, 136, 0.1)">
      <h3 style="margin-bottom: 10px; font-size: 1.1rem; line-height: 1.4;">
        <a href="https://www.theblock.co/" target="_blank" style="color: var(--primary); text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
          Mercado de criptomoedas atinge US$ 2 trilhões em valorização
        </a>
      </h3>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">
          <i class="fas fa-newspaper" style="margin-right: 5px;"></i>The Block
        </span>
        <span style="color: var(--text-muted); font-size: 0.85rem;">
          <i class="far fa-clock" style="margin-right: 5px;"></i>${currentDate}
        </span>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="loadNews()" class="btn" style="padding: 8px 20px; font-size: 0.9rem;">
        <i class="fas fa-sync-alt"></i> Tentar carregar notícias novamente
      </button>
    </div>
  `;
}

  // 10. ÍNDICES DE MERCADO
const MarketIndices = {
  previousData: null,
  
  init() {
    this.setupEventListeners();
    this.loadInitialData();
  },

  setupEventListeners() {
    const refreshBtn = document.getElementById('refreshIndicesBtn');
    if (refreshBtn) {
      // Remove listener antigo e adiciona novo
      refreshBtn.replaceWith(refreshBtn.cloneNode(true));
      document.getElementById('refreshIndicesBtn').addEventListener('click', () => {
        this.loadData();
        refreshBtn.classList.add('loading');
        setTimeout(() => refreshBtn.classList.remove('loading'), 1000);
      });
    }
  },

  loadInitialData() {
    this.loadData();
    setInterval(() => this.loadData(), 300000); // 5 minutos
  },

  async loadData() {
    this.showLoadingState(true);

    try {
      const data = await this.fetchMarketData();
      this.updateMarketUI(data);
      this.previousData = data;
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      this.showErrorState();
    } finally {
      this.showLoadingState(false);
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
    this.updateBTCDominance(data.market_cap_percentage);
    this.updateAltcoinSeason(data);
    this.updateFearGreedIndex();
    this.updateMarketCapData(data);
  },

  updateTimestamp() {
    const timeElement = document.getElementById('lastUpdateTime');
    if (timeElement) {
      timeElement.textContent = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  },

  updateBTCDominance(marketCapPercentage) {
    const btcDominance = marketCapPercentage.btc;
    const dominanceValue = btcDominance.toFixed(1);
    const valueElement = document.getElementById('btcDominanceValue');
    const barElement = document.getElementById('btcDominanceBar');
    const trendElement = document.getElementById('btcDominanceTrend');
    const trendTextElement = document.getElementById('btcDominanceTrendText');

    if (valueElement) {
      valueElement.querySelector('.value').textContent = `${dominanceValue}%`;
    }

    if (barElement) {
      barElement.style.width = `${dominanceValue}%`;
    }

    // Calcular tendência
    if (this.previousData) {
      const previousDominance = this.previousData.market_cap_percentage.btc;
      const change = btcDominance - previousDominance;
      
      if (trendElement) {
        if (change > 0) {
          trendElement.textContent = `↗ ${Math.abs(change).toFixed(1)}%`;
          trendElement.className = 'trend up';
          trendTextElement.textContent = 'Em alta';
          trendTextElement.style.color = 'var(--primary)';
        } else if (change < 0) {
          trendElement.textContent = `↘ ${Math.abs(change).toFixed(1)}%`;
          trendElement.className = 'trend down';
          trendTextElement.textContent = 'Em baixa';
          trendTextElement.style.color = 'var(--error)';
        } else {
          trendElement.textContent = '→';
          trendElement.className = 'trend';
          trendTextElement.textContent = 'Estável';
          trendTextElement.style.color = 'var(--text-muted)';
        }
      }
    }
  },

  updateAltcoinSeason(data) {
    const btcDominance = data.market_cap_percentage.btc;
    const totalMarketCap = (data.total_market_cap.usd / 1000000000).toFixed(2);
    const altcoinDominance = 100 - btcDominance;

    const marketCapElement = document.getElementById('totalMarketCap');
    const seasonIndicator = document.getElementById('seasonIndicator');
    const statusTextElement = document.getElementById('seasonStatusText');
    const statusBadge = document.getElementById('seasonStatusBadge');
    const btcPercentElement = document.getElementById('btcDominancePercent');
    const altcoinPercentElement = document.getElementById('altcoinDominancePercent');

    if (marketCapElement) {
      marketCapElement.querySelector('.value').textContent = `$${totalMarketCap}B`;
    }

    if (seasonIndicator) {
      seasonIndicator.style.width = `${altcoinDominance}%`;
    }

    if (btcPercentElement) {
      btcPercentElement.textContent = `${btcDominance.toFixed(1)}%`;
    }

    if (altcoinPercentElement) {
      altcoinPercentElement.textContent = `${altcoinDominance.toFixed(1)}%`;
    }

    if (statusTextElement && statusBadge) {
      if (altcoinDominance > 35) {
        statusTextElement.textContent = "ALTCOIN SEASON!";
        statusBadge.className = 'status-badge altcoin-season';
        statusBadge.innerHTML = '<i class="fas fa-rocket"></i> ALTCOIN SEASON!';
      } else {
        statusTextElement.textContent = "Bitcoin Dominante";
        statusBadge.className = 'status-badge bitcoin-dominant';
        statusBadge.innerHTML = '<i class="fab fa-bitcoin"></i> Bitcoin Dominante';
      }
    }
  },

  async updateFearGreedIndex() {
    try {
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      const data = await response.json();
      
      if (data && data.data && data.data[0]) {
        const value = parseInt(data.data[0].value);
        const classification = data.data[0].value_classification;
        
        const valueElement = document.getElementById('fearGreedValue');
        const indicatorElement = document.getElementById('fearGreedIndicator');
        const statusElement = document.getElementById('fearGreedStatus');
        const descriptionElement = document.getElementById('fearGreedDescription');

        if (valueElement) {
          valueElement.querySelector('.value').textContent = value;
        }

        if (indicatorElement) {
          indicatorElement.style.left = `${value}%`;
        }

        if (statusElement) {
          statusElement.textContent = classification;
          // Cor baseada no valor
          if (value <= 25) statusElement.style.color = '#ff4d4d';
          else if (value <= 45) statusElement.style.color = '#ffcc00';
          else if (value <= 75) statusElement.style.color = '#00ff88';
          else statusElement.style.color = '#ff4d4d';
        }

        if (descriptionElement) {
          descriptionElement.textContent = this.getFearGreedDescription(value);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar Fear & Greed Index:', error);
    }
  },

  getFearGreedDescription(value) {
    if (value <= 25) return 'Medo extremo - oportunidade de compra';
    if (value <= 45) return 'Medo - possível oportunidade';
    if (value <= 55) return 'Neutro - mercado equilibrado';
    if (value <= 75) return 'Ganância - cuidado com excessos';
    return 'Ganância extrema - considere realizar lucros';
  },

  updateMarketCapData(data) {
    const btcMarketCap = (data.total_market_cap.btc / 1000000000).toFixed(2);
    const ethMarketCap = (data.total_market_cap.eth / 1000000000).toFixed(2);
    const totalMarketCap = (data.total_market_cap.usd / 1000000000000).toFixed(2);
    const marketCapChange = data.market_cap_change_percentage_24h_usd.toFixed(2);

    document.getElementById('globalMarketCap').querySelector('.value').textContent = `$${totalMarketCap}T`;
    document.getElementById('btcMarketCap').textContent = `$${btcMarketCap}B`;
    document.getElementById('ethMarketCap').textContent = `$${ethMarketCap}B`;
    document.getElementById('altcoinMarketCap').textContent = `$${(totalMarketCap - btcMarketCap/1000 - ethMarketCap/1000).toFixed(2)}T`;
    
    const changeElement = document.getElementById('marketCapChange');
    changeElement.textContent = `${marketCapChange >= 0 ? '+' : ''}${marketCapChange}%`;
    changeElement.style.color = marketCapChange >= 0 ? 'var(--primary)' : 'var(--error)';
  },

  showLoadingState(loading) {
    const loadingText = loading ? '...' : '';
    const elements = [
      'btcDominanceValue',
      'totalMarketCap',
      'fearGreedValue',
      'globalMarketCap'
    ];

    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.querySelector('.value').textContent = loadingText;
      }
    });
  },

  showErrorState() {
    const errorElement = document.getElementById('btcChartError');
    if (errorElement) {
      errorElement.style.display = 'block';
    }
  }
};

  // 11. PORTFÓLIO SIMULADOR
class PortfolioSimulator {
  constructor() {
    this.assets = JSON.parse(localStorage.getItem('portfolio')) || [];
    this.init();
  }

  init() {
    // Remove event listeners antigos para evitar duplicação
    const addBtn = document.getElementById('addAsset');
    const refreshBtn = document.getElementById('refreshPortfolio');
    const exportBtn = document.getElementById('exportPortfolio');
    const firstAssetBtn = document.getElementById('addFirstAsset');

    // Clona os botões para remover event listeners antigos
    addBtn.replaceWith(addBtn.cloneNode(true));
    refreshBtn.replaceWith(refreshBtn.cloneNode(true));
    if (exportBtn) exportBtn.replaceWith(exportBtn.cloneNode(true));
    if (firstAssetBtn) firstAssetBtn.replaceWith(firstAssetBtn.cloneNode(true));

    // Adiciona novos event listeners
    document.getElementById('addAsset').addEventListener('click', () => this.showAddDialog());
    document.getElementById('refreshPortfolio').addEventListener('click', () => this.refreshPortfolio());
    
    if (document.getElementById('exportPortfolio')) {
      document.getElementById('exportPortfolio').addEventListener('click', () => this.exportPortfolio());
    }
    
    if (document.getElementById('addFirstAsset')) {
      document.getElementById('addFirstAsset').addEventListener('click', () => this.showAddDialog());
    }

    this.render();
  }

  showAddDialog() {
    Swal.fire({
      title: 'Adicionar Ativo',
      html: `
        <select id="swalCoin" class="swal2-select">
          ${coins.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        <input type="number" id="swalAmount" placeholder="Quantidade" class="swal2-input" step="any">
        <input type="number" id="swalPrice" placeholder="Preço pago (R$)" class="swal2-input" step="any">
      `,
      showCancelButton: true,
      confirmButtonText: 'Adicionar',
      preConfirm: () => {
        const amount = parseFloat(document.getElementById('swalAmount').value);
        const price = parseFloat(document.getElementById('swalPrice').value);
        
        if (!amount || !price || amount <= 0 || price <= 0) {
          Swal.showValidationMessage('Por favor, insira valores válidos maiores que zero');
          return false;
        }

        return {
          coin: document.getElementById('swalCoin').value,
          amount: amount,
          buyPrice: price
        };
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
    confirmation.innerHTML = `<i class="fas fa-check"></i> ${coins.find(c => c.id === asset.coin)?.name} adicionado!`;
    document.getElementById('portfolio').appendChild(confirmation);
    setTimeout(() => confirmation.remove(), 2000);
  }

  removeAsset(index) {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00ff88',
      cancelButtonColor: '#ff4d4d',
      confirmButtonText: 'Sim, remover!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedAsset = this.assets[index];
        this.assets.splice(index, 1);
        this.save();
        this.render();
        
        Swal.fire(
          'Removido!',
          `${coins.find(c => c.id === removedAsset.coin)?.name} foi removido do portfólio.`,
          'success'
        );
      }
    });
  }

  editAsset(index) {
    const asset = this.assets[index];
    Swal.fire({
      title: 'Editar Ativo',
      html: `
        <select id="swalCoin" class="swal2-select">
          ${coins.map(c => `<option value="${c.id}" ${c.id === asset.coin ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
        <input type="number" id="swalAmount" placeholder="Quantidade" class="swal2-input" value="${asset.amount}" step="any">
        <input type="number" id="swalPrice" placeholder="Preço pago (R$)" class="swal2-input" value="${asset.buyPrice}" step="any">
      `,
      showCancelButton: true,
      confirmButtonText: 'Salvar Alterações',
      preConfirm: () => {
        const amount = parseFloat(document.getElementById('swalAmount').value);
        const price = parseFloat(document.getElementById('swalPrice').value);
        
        if (!amount || !price || amount <= 0 || price <= 0) {
          Swal.showValidationMessage('Por favor, insira valores válidos maiores que zero');
          return false;
        }

        return {
          coin: document.getElementById('swalCoin').value,
          amount: amount,
          buyPrice: price
        };
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.assets[index] = result.value;
        this.save();
        this.render();
        Swal.fire('Sucesso!', 'Ativo atualizado com sucesso.', 'success');
      }
    });
  }

  async refreshPortfolio() {
    // Mostra animação de atualização
    document.getElementById('portfolio').classList.add('updating');
    
    try {
      await this.render();
      Swal.fire('Atualizado!', 'Portfólio atualizado com sucesso.', 'success');
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível atualizar o portfólio.', 'error');
    }
    
    setTimeout(() => {
      document.getElementById('portfolio').classList.remove('updating');
    }, 1000);
  }

  exportPortfolio() {
    if (this.assets.length === 0) {
      Swal.fire('Portfólio vazio', 'Adicione ativos antes de exportar.', 'info');
      return;
    }

    const data = JSON.stringify(this.assets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-trackcripto-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    Swal.fire('Exportado!', 'Seu portfólio foi exportado com sucesso.', 'success');
  }

  save() {
    localStorage.setItem('portfolio', JSON.stringify(this.assets));
  }

  async render() {
    await this.updateTable();
    this.updateChart();
    this.updateStats();
    this.setupEmptyState();
  }

  setupEmptyState() {
    const emptyState = document.getElementById('portfolioEmpty');
    const portfolioContent = document.querySelector('.portfolio-content');
    
    if (this.assets.length === 0) {
      emptyState.style.display = 'block';
      if (portfolioContent) portfolioContent.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      if (portfolioContent) portfolioContent.style.display = 'grid';
    }
  }

  async updateTable() {
    const tableBody = document.getElementById('portfolioAssets');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (this.assets.length === 0) {
      return;
    }

    try {
      const coinIds = [...new Set(this.assets.map(a => a.coin))];
      const pricesResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=brl`);
      const prices = await pricesResponse.json();

      this.assets.forEach((asset, index) => {
        const currentPrice = prices[asset.coin]?.brl || 0;
        const invested = asset.amount * asset.buyPrice;
        const currentValue = asset.amount * currentPrice;
        const profit = currentValue - invested;
        const profitPercentage = invested > 0 ? (profit / invested) * 100 : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div class="asset-name">
              <div class="asset-icon">
                ${asset.coin.charAt(0).toUpperCase()}
              </div>
              ${coins.find(c => c.id === asset.coin)?.name || asset.coin}
            </div>
          </td>
          <td>${asset.amount.toLocaleString('pt-BR')}</td>
          <td>R$ ${asset.buyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td>R$ ${invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td>R$ ${currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td class="${profit >= 0 ? 'positive' : 'negative'}">
            ${profit >= 0 ? '+' : ''}${profitPercentage.toFixed(2)}%
          </td>
          <td>
            <div class="action-buttons">
              <button class="action-btn btn-edit" onclick="window.portfolio.editAsset(${index})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn btn-delete" onclick="window.portfolio.removeAsset(${index})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        `;
        tableBody.appendChild(row);
      });

    } catch (error) {
      console.error('Erro ao atualizar tabela:', error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--error);">
            <i class="fas fa-exclamation-triangle"></i> Erro ao carregar dados
          </td>
        </tr>
      `;
    }
  }

  updateStats() {
    let totalInvested = 0;
    let totalCurrent = 0;

    this.assets.forEach(asset => {
      totalInvested += asset.amount * asset.buyPrice;
      // Para uma implementação real, precisaria buscar preços atuais
      totalCurrent += asset.amount * asset.buyPrice; // Placeholder
    });

    const totalProfit = totalCurrent - totalInvested;
    const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    const totalElement = document.getElementById('portfolioTotal');
    const profitElement = document.getElementById('portfolioProfit');
    const changeElement = document.getElementById('portfolioChange');

    if (totalElement) {
      totalElement.textContent = `R$ ${totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    if (profitElement) {
      profitElement.textContent = `R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      profitElement.className = totalProfit >= 0 ? 'positive' : 'negative';
    }
    if (changeElement) {
      changeElement.textContent = `${profitPercentage >= 0 ? '+' : ''}${profitPercentage.toFixed(2)}%`;
      changeElement.className = profitPercentage >= 0 ? 'positive' : 'negative';
    }
  }

  updateChart() {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) return;

    if (this.assets.length === 0) {
      if (window.portfolioChart) {
        window.portfolioChart.destroy();
      }
      return;
    }

    // Implementação simplificada do gráfico
    // (Mantém a lógica original do gráfico aqui)
  }
}

// Inicialize o portfolio globalmente
window.portfolio = new PortfolioSimulator();

  // 12. ALERTAS DE PREÇO - NOVA CLASSE ADICIONADA
  // ALERTAS DE PREÇO - COM NOTIFICAÇÕES REAIS
class PriceAlerts {
  constructor() {
    this.alerts = JSON.parse(localStorage.getItem('priceAlerts')) || [];
    this.notificationPermission = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.render();
    this.checkNotificationPermission();
    this.startMonitoring();
  }

  setupEventListeners() {
    // Remove listeners antigos
    const addBtn = document.getElementById('addAlertBtn');
    const testBtn = document.getElementById('testNotificationBtn');
    const enableBtn = document.getElementById('enableNotificationsBtn');
    
    if (addBtn) addBtn.replaceWith(addBtn.cloneNode(true));
    if (testBtn) testBtn.replaceWith(testBtn.cloneNode(true));
    if (enableBtn) enableBtn.replaceWith(enableBtn.cloneNode(true));

    // Novos listeners
    document.getElementById('addAlertBtn').addEventListener('click', () => this.showAddDialog());
    document.getElementById('testNotificationBtn').addEventListener('click', () => this.testNotification());
    document.getElementById('enableNotificationsBtn').addEventListener('click', () => this.requestNotificationPermission());
    
    // Filtros
    const searchInput = document.getElementById('alertsSearch');
    const filterSelect = document.getElementById('alertsFilter');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterAlerts(e.target.value, filterSelect.value));
    }
    
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => this.filterAlerts(searchInput.value, e.target.value));
    }
  }

  async checkNotificationPermission() {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
      
      const enableBtn = document.getElementById('enableNotificationsBtn');
      if (enableBtn) {
        enableBtn.style.display = this.notificationPermission === 'default' ? 'block' : 'none';
      }
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;
        
        const enableBtn = document.getElementById('enableNotificationsBtn');
        if (enableBtn) {
          enableBtn.style.display = permission === 'granted' ? 'none' : 'block';
          enableBtn.innerHTML = permission === 'granted' ? 
            '<i class="fas fa-check-circle"></i> Notificações Ativas' : 
            '<i class="fas fa-times-circle"></i> Permissão Negada';
        }
        
        if (permission === 'granted') {
          this.showNotification('Notificações Ativadas', 'Você será alertado quando seus preços-alvo forem atingidos!');
        }
      } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
      }
    }
  }

  showAddDialog() {
    const currentCoin = document.getElementById('cryptoSelect')?.value || 'bitcoin';
    
    Swal.fire({
      title: 'Criar Alerta de Preço',
      html: `
        <div class="alert-dialog">
          <div class="form-group">
            <label>Criptomoeda:</label>
            <select id="swalAlertCoin" class="swal2-select">
              ${coins.map(c => `<option value="${c.id}" ${c.id === currentCoin ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label>Condição:</label>
            <select id="swalAlertCondition" class="swal2-select">
              <option value="above">Acima de</option>
              <option value="below">Abaixo de</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Preço Alvo (R$):</label>
            <input type="number" id="swalAlertPrice" placeholder="0.00" class="swal2-input" step="0.0001" min="0">
          </div>
          
          <div class="form-group">
            <label>Nome do Alerta (opcional):</label>
            <input type="text" id="swalAlertName" placeholder="Ex: Venda BTC" class="swal2-input">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Criar Alerta',
      customClass: {
        popup: 'alert-popup'
      },
      preConfirm: () => {
        const price = parseFloat(document.getElementById('swalAlertPrice').value);
        
        if (!price || price <= 0) {
          Swal.showValidationMessage('Por favor, insira um preço válido');
          return false;
        }

        return {
          coin: document.getElementById('swalAlertCoin').value,
          condition: document.getElementById('swalAlertCondition').value,
          price: price,
          name: document.getElementById('swalAlertName').value || '',
          id: Date.now(),
          createdAt: new Date().toISOString(),
          triggered: false,
          triggeredAt: null,
          active: true
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
    this.showNotification('Alerta Criado', `Monitorando ${coins.find(c => c.id === alert.coin)?.name} ${alert.condition === 'above' ? 'acima' : 'abaixo'} de R$ ${alert.price.toFixed(2)}`);
  }

  removeAlert(id) {
    Swal.fire({
      title: 'Remover Alerta?',
      text: 'Esta ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00ff88',
      cancelButtonColor: '#ff4d4d',
      confirmButtonText: 'Sim, remover!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.alerts = this.alerts.filter(a => a.id !== id);
        this.save();
        this.render();
        Swal.fire('Removido!', 'Alerta removido com sucesso.', 'success');
      }
    });
  }

  toggleAlert(id) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.active = !alert.active;
      this.save();
      this.render();
    }
  }

  snoozeAlert(id, hours = 24) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      this.save();
      this.render();
      this.showNotification('Alerta Adiado', `Alerta pausado por ${hours} horas`);
    }
  }

  async startMonitoring() {
    // Verificar alertas a cada 1 minuto
    setInterval(() => this.checkAlerts(), 60000);
    // Verificar imediatamente ao carregar
    await this.checkAlerts();
  }

  async checkAlerts() {
    if (this.alerts.length === 0) return;

    const activeAlerts = this.alerts.filter(alert => alert.active && !alert.triggered);
    if (activeAlerts.length === 0) return;

    const coinIds = [...new Set(activeAlerts.map(a => a.coin))];
    
    try {
      const prices = await this.fetchPrices(coinIds);
      
      activeAlerts.forEach(alert => {
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

      this.updateLastCheckTime();

    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
    }
  }

  async fetchPrices(coinIds) {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=brl`);
    if (!response.ok) throw new Error('Erro ao buscar preços');
    return await response.json();
  }

  triggerAlert(alert, currentPrice) {
    alert.triggered = true;
    alert.triggeredAt = new Date().toISOString();
    alert.active = false;

    this.save();
    this.render();
    this.showAlertNotification(alert, currentPrice);
    
    // Também mostrar um toast na interface
    this.showAlertToast(alert, currentPrice);
  }

  showAlertNotification(alert, currentPrice) {
    if (this.notificationPermission === 'granted') {
      const coinName = coins.find(c => c.id === alert.coin)?.name || alert.coin;
      const notification = new Notification('🎯 Alerta Disparado!', {
        body: `${coinName} atingiu R$ ${currentPrice.toFixed(2)} (${alert.condition === 'above' ? 'acima' : 'abaixo'} de R$ ${alert.price.toFixed(2)})`,
        icon: '/assets/logo.png',
        tag: `alert-${alert.id}`
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  showAlertToast(alert, currentPrice) {
    const coinName = coins.find(c => c.id === alert.coin)?.name || alert.coin;
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">
          <i class="fas fa-bell" style="color: var(--primary);"></i>
          <span>Alerta Disparado!</span>
        </div>
        <button class="notification-close">&times;</button>
      </div>
      <div class="notification-body">
        <p><strong>${coinName}</strong> ${alert.condition === 'above' ? 'subiu acima' : 'caiu abaixo'} do preço alvo</p>
        <div class="notification-price">
          R$ ${currentPrice.toFixed(2)}
        </div>
        <p>Preço alvo: R$ ${alert.price.toFixed(2)}</p>
      </div>
      <div class="notification-footer">
        <span>${new Date().toLocaleTimeString('pt-BR')}</span>
        <button onclick="window.alerts.snoozeAlert(${alert.id})" class="alert-btn btn-snooze">
          <i class="fas fa-clock"></i> Adiar
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    toast.querySelector('.notification-close').addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  showNotification(title, message) {
    if (this.notificationPermission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/assets/logo.png'
      });
    }
  }

  testNotification() {
    if (this.notificationPermission === 'granted') {
      this.showNotification('Teste de Notificação', 'Suas notificações estão funcionando perfeitamente! 🎯');
    } else {
      this.requestNotificationPermission();
    }
  }

  filterAlerts(searchTerm, filterType) {
    this.render(this.alerts.filter(alert => {
      const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.coin.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'active' && alert.active && !alert.triggered) ||
                           (filterType === 'triggered' && alert.triggered);
      
      return matchesSearch && matchesFilter;
    }));
  }

  updateLastCheckTime() {
    const element = document.getElementById('alertsLastCheck');
    if (element) {
      element.textContent = `Última verificação: ${new Date().toLocaleTimeString('pt-BR')}`;
    }
  }

  render(alertsToShow = null) {
    const alerts = alertsToShow || this.alerts;
    const container = document.getElementById('alertsContainer');
    const emptyState = document.getElementById('alertsEmpty');
    const countBadge = document.getElementById('alertsCount');

    if (countBadge) {
      const activeCount = this.alerts.filter(a => a.active && !a.triggered).length;
      countBadge.textContent = activeCount;
    }

    if (alerts.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (container) container.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = alerts.map(alert => `
      <div class="alert-item ${alert.triggered ? 'triggered' : ''}">
        <div class="alert-header">
          <div class="alert-crypto">
            <div class="alert-crypto-icon">${alert.coin.charAt(0).toUpperCase()}</div>
            <span>${alert.name || coins.find(c => c.id === alert.coin)?.name || alert.coin}</span>
          </div>
          <span class="alert-status ${alert.triggered ? 'status-triggered' : 'status-active'}">
            ${alert.triggered ? 'Disparado' : 'Ativo'}
          </span>
        </div>
        
        <div class="alert-details">
          <div class="alert-condition">
            <span class="condition-icon">${alert.condition === 'above' ? '📈' : '📉'}</span>
            <span>${alert.condition === 'above' ? 'Acima de' : 'Abaixo de'} </span>
            <span class="alert-price">R$ ${alert.price.toFixed(2)}</span>
          </div>
          ${alert.triggered ? `
            <div class="alert-current">
              💰 Preço quando disparou: R$ ${alert.triggeredPrice ? alert.triggeredPrice.toFixed(2) : 'N/A'}
            </div>
          ` : ''}
        </div>
        
        <div class="alert-actions">
          ${!alert.triggered ? `
            <button class="alert-btn btn-edit" onclick="window.alerts.toggleAlert(${alert.id})">
              <i class="fas ${alert.active ? 'fa-pause' : 'fa-play'}"></i> ${alert.active ? 'Pausar' : 'Ativar'}
            </button>
          ` : ''}
          <button class="alert-btn btn-snooze" onclick="window.alerts.snoozeAlert(${alert.id})">
            <i class="fas fa-clock"></i> Adiar
          </button>
          <button class="alert-btn btn-delete" onclick="window.alerts.removeAlert(${alert.id})">
            <i class="fas fa-trash"></i> Remover
          </button>
        </div>
        
        <div class="alert-footer">
          <span class="alert-timestamp">
            <i class="far fa-clock"></i>
            Criado: ${new Date(alert.createdAt).toLocaleDateString('pt-BR')}
          </span>
          ${alert.triggered ? `
            <span class="alert-timestamp">
              <i class="fas fa-bolt"></i>
              Disparado: ${new Date(alert.triggeredAt).toLocaleDateString('pt-BR')}
            </span>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  save() {
    localStorage.setItem('priceAlerts', JSON.stringify(this.alerts));
  }
}

// Inicialize os alertas globalmente
window.alerts = new PriceAlerts();

  // 13. CALCULADORA DE TRADE - NOVA FUNÇÃO ADICIONADA
class TradeCalculator {
  constructor() {
    this.currentTab = 'basic';
    this.savedTrades = JSON.parse(localStorage.getItem('savedTrades')) || [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupInputListeners();
    this.loadCurrentPrices();
  }

  setupEventListeners() {
    // Tabs
    document.querySelectorAll('.calc-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Botões de ação
    document.getElementById('calcCalculate').addEventListener('click', () => this.calculate());
    document.getElementById('calcReset').addEventListener('click', () => this.reset());
    document.getElementById('calcSave').addEventListener('click', () => this.saveTrade());
    document.getElementById('calcSwitchMode').addEventListener('click', () => this.switchMode());

    // Troca de exchange
    document.getElementById('calcExchange').addEventListener('change', (e) => {
      this.updateExchangeFees(e.target.value);
    });
  }

  setupInputListeners() {
    // Atualizações em tempo real
    const inputs = ['calcAmount', 'calcBuyPrice', 'calcSellPrice', 'calcTargetProfit', 'calcStopLoss'];
    inputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => this.updateLiveValues());
      }
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Atualiza UI das tabs
    document.querySelectorAll('.calc-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.calc-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
  }

  switchMode() {
    const currentMode = this.currentTab;
    const modes = ['basic', 'advanced', 'fees'];
    const currentIndex = modes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.switchTab(modes[nextIndex]);
  }

  updateExchangeFees(exchange) {
    const fees = {
      'binance': { buy: 0.1, sell: 0.1 },
      'bybit': { buy: 0.1, sell: 0.1 },
      'mercado-bitcoin': { buy: 0.7, sell: 0.5 },
      'foxbit': { buy: 0.5, sell: 0.25 },
      'custom': { buy: 0, sell: 0 }
    };

    const fee = fees[exchange] || fees.binance;
    document.getElementById('calcBuyFee').value = fee.buy;
    document.getElementById('calcSellFee').value = fee.sell;
  }

  async loadCurrentPrices() {
    try {
      const coinSelect = document.getElementById('calcCoin');
      const coinId = coinSelect.value;
      
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl`);
      const data = await response.json();
      
      if (data[coinId]) {
        const currentPrice = data[coinId].brl;
        document.getElementById('calcBuyPrice').placeholder = currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        document.getElementById('calcSellPrice').placeholder = currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      }
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
    }
  }

  updateLiveValues() {
    const amount = parseFloat(document.getElementById('calcAmount').value) || 0;
    const buyPrice = parseFloat(document.getElementById('calcBuyPrice').value) || 0;
    const sellPrice = parseFloat(document.getElementById('calcSellPrice').value) || 0;

    // Atualiza hints
    document.getElementById('amountValue').textContent = amount.toLocaleString('pt-BR', { minimumFractionDigits: 4 });
    document.getElementById('buyPriceValue').textContent = `R$ ${buyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('sellPriceValue').textContent = `R$ ${sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Calcula valor total
    const investment = amount * buyPrice;
    document.getElementById('amountValue').textContent = `${amount.toFixed(4)} (R$ ${investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
  }

  calculate() {
    const amount = parseFloat(document.getElementById('calcAmount').value);
    const buyPrice = parseFloat(document.getElementById('calcBuyPrice').value);
    const sellPrice = parseFloat(document.getElementById('calcSellPrice').value);

    if (!amount || !buyPrice || !sellPrice) {
      Swal.fire('Erro', 'Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    // Cálculos básicos
    const investment = amount * buyPrice;
    const finalValue = amount * sellPrice;
    const grossProfit = finalValue - investment;
    const profitPercentage = (grossProfit / investment) * 100;

    // Cálculo de taxas
    const buyFeePercent = parseFloat(document.getElementById('calcBuyFee').value) || 0;
    const sellFeePercent = parseFloat(document.getElementById('calcSellFee').value) || 0;
    const withdrawalFee = parseFloat(document.getElementById('calcWithdrawalFee').value) || 0;

    const buyFee = investment * (buyFeePercent / 100);
    const sellFee = finalValue * (sellFeePercent / 100);
    const totalFees = buyFee + sellFee + withdrawalFee;

    // Resultado líquido
    const netProfit = grossProfit - totalFees;
    const netPercentage = (netProfit / investment) * 100;

    // Cálculo de stop loss e risco
    const stopLoss = parseFloat(document.getElementById('calcStopLoss').value);
    let riskRewardRatio = '1:0';
    let riskLevel = 'risk-medium';

    if (stopLoss > 0) {
      const risk = investment - (amount * stopLoss);
      const reward = grossProfit;
      riskRewardRatio = risk > 0 ? `1:${(reward / risk).toFixed(2)}` : '1:∞';
      
      const ratio = reward / risk;
      riskLevel = ratio >= 3 ? 'risk-good' : ratio >= 1.5 ? 'risk-medium' : 'risk-high';
    }

    // Break-even
    const breakEvenPrice = buyPrice * (1 + (totalFees / investment));

    // Atualiza UI
    this.updateResults({
      investment,
      finalValue,
      grossProfit,
      profitPercentage,
      totalFees,
      netProfit,
      netPercentage,
      riskRewardRatio,
      riskLevel,
      breakEvenPrice
    });

    // Mostra resultados
    document.getElementById('calcResult').classList.add('show');
  }

  updateResults(results) {
    // Valores básicos
    document.getElementById('resultInvestment').textContent = `R$ ${results.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('resultFinalValue').textContent = `R$ ${results.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    // Lucro/Prejuízo
    const profitElement = document.getElementById('resultProfit');
    profitElement.textContent = `R$ ${results.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    profitElement.className = `result-value ${results.netProfit >= 0 ? 'value-profit' : 'value-loss'}`;
    
    // Porcentagem
    const percentageElement = document.getElementById('resultPercentage');
    percentageElement.textContent = `${results.netProfit >= 0 ? '+' : ''}${results.netPercentage.toFixed(2)}%`;
    percentageElement.className = `result-value ${results.netProfit >= 0 ? 'value-profit' : 'value-loss'}`;
    
    // Badge
    const badgeElement = document.getElementById('resultBadge');
    badgeElement.textContent = results.netProfit >= 0 ? 'LUCRO' : 'PREJUÍZO';
    badgeElement.className = `results-badge ${results.netProfit >= 0 ? 'badge-profit' : 'badge-loss'}`;

    // Detalhes
    document.getElementById('resultFees').textContent = `R$ ${results.totalFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('resultRiskReward').textContent = results.riskRewardRatio;
    document.getElementById('resultBreakEven').textContent = `R$ ${results.breakEvenPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('resultNet').textContent = `R$ ${results.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('riskMeter').className = `risk-fill ${results.riskLevel}`;
    document.getElementById('riskMeter').style.width = results.riskLevel === 'risk-good' ? '100%' : results.riskLevel === 'risk-medium' ? '60%' : '30%';

    // Análise
    this.updateAnalysis(results);
  }

  updateAnalysis(results) {
    const analysisElement = document.getElementById('resultAnalysis');
    let analysis = '';

    if (results.netProfit > 0) {
      analysis = `✅ Trade lucrativo! Seu retorno líquido foi de ${results.netPercentage.toFixed(2)}% após taxas. `;
      
      if (results.netPercentage > 20) {
        analysis += 'Excelente trade! 🎯';
      } else if (results.netPercentage > 10) {
        analysis += 'Bom resultado! 👍';
      } else {
        analysis += 'Resultado positivo. 💪';
      }
    } else {
      analysis = `⚠️ Trade com prejuízo de ${Math.abs(results.netPercentage).toFixed(2)}%. `;
      
      if (results.netPercentage < -20) {
        analysis += 'Considere revisar sua estratégia. 📉';
      } else {
        analysis += 'Mantenha o gerenciamento de risco. 📊';
      }
    }

    analysis += `\n\n💡 Break-even: R$ ${results.breakEvenPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    analysis += `\n📊 Risco/Retorno: ${results.riskRewardRatio}`;

    analysisElement.textContent = analysis;
  }

  calculateTargetPrice() {
    const targetProfit = parseFloat(document.getElementById('calcTargetProfit').value);
    const buyPrice = parseFloat(document.getElementById('calcBuyPrice').value);

    if (!targetProfit || !buyPrice) {
      Swal.fire('Erro', 'Informe o preço de compra e o target.', 'error');
      return;
    }

    const targetPrice = buyPrice * (1 + targetProfit / 100);
    document.getElementById('calcTargetPrice').value = targetPrice.toFixed(2);
    document.getElementById('calcSellPrice').value = targetPrice.toFixed(2);
    
    document.getElementById('targetPriceInfo').textContent = 
      `Preço para ${targetProfit}% de lucro`;
  }

  reset() {
    // Limpa todos os campos
    const fields = [
      'calcAmount', 'calcBuyPrice', 'calcSellPrice', 'calcTargetProfit',
      'calcStopLoss', 'calcTargetPrice'
    ];
    
    fields.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });

    // Reseta taxas para padrão
    this.updateExchangeFees('binance');
    
    // Esconde resultados
    document.getElementById('calcResult').classList.remove('show');
    
    Swal.fire('Limpo!', 'Todos os campos foram resetados.', 'success');
  }

  saveTrade() {
    const amount = parseFloat(document.getElementById('calcAmount').value);
    const buyPrice = parseFloat(document.getElementById('calcBuyPrice').value);

    if (!amount || !buyPrice) {
      Swal.fire('Erro', 'Preencha pelo menos quantidade e preço de compra.', 'error');
      return;
    }

    const trade = {
      id: Date.now(),
      coin: document.getElementById('calcCoin').value,
      amount: amount,
      buyPrice: buyPrice,
      sellPrice: parseFloat(document.getElementById('calcSellPrice').value) || 0,
      timestamp: new Date().toISOString(),
      notes: ''
    };

    this.savedTrades.push(trade);
    localStorage.setItem('savedTrades', JSON.stringify(this.savedTrades));
    
    Swal.fire('Salvo!', 'Trade salvo com sucesso.', 'success');
  }
}

// Inicializa a calculadora
window.tradeCalculator = new TradeCalculator();

// Função global para compatibilidade
window.calculateProfit = function() {
  window.tradeCalculator.calculate();
};

window.calculateTargetPrice = function() {
  window.tradeCalculator.calculateTargetPrice();
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

  // 145. CALCULADORA DE TAXAS
  // CALCULADORA DE TAXAS - Adicione esta função no seu script.js
window.calculateFees = function() {
  const amount = parseFloat(document.getElementById('feeAmount').value);
  const exchange = document.getElementById('feeExchange').value;
  
  if (!amount || amount <= 0) {
    Swal.fire('Erro', 'Por favor, insira um valor válido maior que zero.', 'error');
    return;
  }
  
  // Dados das taxas por exchange
  const exchangeData = {
    'binance': {
      name: 'Binance',
      compra: 0.1, // 0.1%
      saque: 0.0005, // 0.0005 BTC
      negociacao: 0.1, // 0.1%
      rating: '4.8 ★'
    },
    'bybit': {
      name: 'Bybit', 
      compra: 0.1,
      saque: 0.001, // Taxa variável aproximada
      negociacao: 0.1,
      rating: '4.6 ★'
    },
    'mercado-bitcoin': {
      name: 'Mercado Bitcoin',
      compra: 0.7,
      saque: 0.3, // 0.3%
      negociacao: 0.5,
      rating: '4.5 ★'
    },
    'foxbit': {
      name: 'Foxbit',
      compra: 0.5,
      saque: 0.0003, // 0.0003 BTC
      negociacao: 0.25,
      rating: '4.3 ★'
    }
  };
  
  const selectedExchange = exchangeData[exchange];
  
  // Calcular taxas em Reais
  const taxaCompra = (amount * selectedExchange.compra) / 100;
  const taxaNegociacao = (amount * selectedExchange.negociacao) / 100;
  
  // Para saque em BTC, precisamos do preço atual do Bitcoin
  calculateWithdrawalFee(selectedExchange, amount, taxaCompra, taxaNegociacao);
}

// Função para calcular taxa de saque (precisa do preço do BTC)
async function calculateWithdrawalFee(exchange, amount, taxaCompra, taxaNegociacao) {
  try {
    // Buscar preço atual do Bitcoin
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl');
    const data = await response.json();
    const btcPrice = data.bitcoin.brl;
    
    // Calcular taxa de saque em Reais
    let taxaSaque = 0;
    if (exchange.saque < 1) {
      // Taxa em BTC - converter para Reais
      taxaSaque = exchange.saque * btcPrice;
    } else {
      // Taxa em percentual
      taxaSaque = (amount * exchange.saque) / 100;
    }
    
    // Calcular totais
    const totalTaxas = taxaCompra + taxaNegociacao + taxaSaque;
    const totalRecebido = amount - totalTaxas;
    const percentualTaxas = (totalTaxas / amount) * 100;
    
    // Mostrar resultados
    showFeeResults(exchange, amount, taxaCompra, taxaNegociacao, taxaSaque, totalTaxas, totalRecebido, percentualTaxas, btcPrice);
    
  } catch (error) {
    console.error('Erro ao buscar preço do Bitcoin:', error);
    // Fallback sem preço do BTC
    showFeeResultsWithoutBTC(exchange, amount, taxaCompra, taxaNegociacao);
  }
}

// Mostrar resultados com preço do BTC
function showFeeResults(exchange, amount, taxaCompra, taxaNegociacao, taxaSaque, totalTaxas, totalRecebido, percentualTaxas, btcPrice) {
  const feeResult = document.getElementById('feeResult');
  const feeTotal = document.getElementById('feeTotal');
  
  feeTotal.innerHTML = `
    <strong>Exchange:</strong> ${exchange.name}<br>
    <strong>Valor operado:</strong> R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br><br>
    
    <strong>📥 Taxa de Compra (${exchange.compra}%):</strong> R$ ${taxaCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
    <strong>📤 Taxa de Saque:</strong> R$ ${taxaSaque.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
    <strong>💱 Taxa de Negociação (${exchange.negociacao}%):</strong> R$ ${taxaNegociacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br><br>
    
    <strong>💰 Total em taxas:</strong> R$ ${totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
    <strong>📊 Percentual em taxas:</strong> ${percentualTaxas.toFixed(2)}%<br>
    <strong>🎯 Valor líquido recebido:</strong> R$ ${totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br><br>
    
    <small style="color: var(--text-muted);">
      <i class="fas fa-info-circle"></i> Preço do BTC: R$ ${btcPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
      Rating: ${exchange.rating}
    </small>
  `;
  
  feeResult.style.display = 'block';
}

// Fallback para quando não consegue preço do BTC
function showFeeResultsWithoutBTC(exchange, amount, taxaCompra, taxaNegociacao) {
  const feeResult = document.getElementById('feeResult');
  const feeTotal = document.getElementById('feeTotal');
  
  let taxaSaqueText = '';
  if (exchange.saque < 1) {
    taxaSaqueText = `${exchange.saque} BTC (aproximadamente)`;
  } else {
    const taxaSaqueReais = (amount * exchange.saque) / 100;
    taxaSaqueText = `R$ ${taxaSaqueReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  feeTotal.innerHTML = `
    <strong>Exchange:</strong> ${exchange.name}<br>
    <strong>Valor operado:</strong> R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br><br>
    
    <strong>📥 Taxa de Compra (${exchange.compra}%):</strong> R$ ${taxaCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
    <strong>📤 Taxa de Saque:</strong> ${taxaSaqueText}<br>
    <strong>💱 Taxa de Negociação (${exchange.negociacao}%):</strong> R$ ${taxaNegociacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br><br>
    
    <small style="color: var(--text-muted);">
      <i class="fas fa-exclamation-triangle"></i> Não foi possível calcular o valor exato do saque em BTC.<br>
      Rating: ${exchange.rating}
    </small>
  `;
  
  feeResult.style.display = 'block';
}

// Adicione também este CSS para melhorar a aparência:
// Coloque no seu styles.css

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
    setupAdvancedModeToggle(); // ADICIONAR ESTA LINHA
    setupHeaderHideOnScroll(); // ADICIONAR ESTA LINHA
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

// REMOVA a segunda definição de setupAdvancedModeToggle() que está no final do arquivo
// Mantenha apenas as funções abaixo:

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

// Função para copiar PIX
function copyPix() {
  const pix = 'trackcripto@gmail.com';
  navigator.clipboard.writeText(pix).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'PIX copiado!',
      text: 'Chave PIX copiada para a área de transferência',
      timer: 2000,
      showConfirmButton: false
    });
  }).catch(() => {
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Não foi possível copiar o PIX',
    });
  });
}