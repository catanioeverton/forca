import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import pytz
import time
import os
import json
import psycopg2
from dotenv import load_dotenv
from flask import Flask
import threading

# ==============================================================================
# CONFIGURAÇÕES
# ==============================================================================
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
currencies = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD']
TZ_OPERACIONAL = pytz.timezone('Etc/GMT+5') # UTC-5 (Nova York)

# Cria o mini-servidor web
app = Flask(__name__)

# ==============================================================================
# ROTA DO SERVIDOR (Para o Render não desligar o script)
# ==============================================================================
@app.route('/')
def home():
    return "<h1>Motor de Cálculo Institucional: ONLINE 🟢</h1><p>O sistema está rodando em segundo plano.</p>"

# ==============================================================================
# FUNÇÕES DE BANCO DE DADOS
# ==============================================================================
def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar no Banco: {e}")
        return None

def save_to_db(timestamp, s1h, sc1h, s4h, sc4h, sd, scd):
    payload = {
        "metadata": {
            "last_update": timestamp.strftime('%H:%M:%S'),
            "timestamp_full": timestamp.strftime('%Y-%m-%d %H:%M:%S')
        },
        "setups": {
            "setup_1h": f"{s1h.idxmax()}{s1h.idxmin()}",
            "setup_4h": f"{s4h.idxmax()}{s4h.idxmin()}",
            "setup_daily": f"{sd.idxmax()}{sd.idxmin()}"
        },
        "data": {
            "h1": s1h.to_dict(),
            "h4": s4h.to_dict(),
            "daily": sd.to_dict()
        },
        "scores": {
            "h1": sc1h.to_dict(),
            "h4": sc4h.to_dict(),
            "daily": scd.to_dict()
        }
    }

    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("INSERT INTO market_history (data_json) VALUES (%s)", (json.dumps(payload),))
            conn.commit()
            cur.close()
            conn.close()
            print(f"✅ DADOS SINCRONIZADOS COM A NUVEM! [{timestamp.strftime('%H:%M:%S')}]")
        except Exception as e:
            print(f"❌ Erro ao salvar no banco: {e}")

# ==============================================================================
# LÓGICA DE CÁLCULO (SEU SISTEMA ORIGINAL)
# ==============================================================================
def calculate_strength(mode):
    data_results = {}
    PERIOD_OFFSET = 12 if mode == "1h" else 48
    print(f"   ⏳ Calculando {mode.upper()}...")

    for base in currencies:
        for quote in currencies:
            if base != quote:
                symbol = f"{base}{quote}=X"
                try:
                    ticker = yf.Ticker(symbol)
                    hist = ticker.history(period="5d", interval="5m")
                    
                    if hist is None or hist.empty or len(hist) < 50: continue
                    hist.index = hist.index.tz_convert(TZ_OPERACIONAL)
                    current_price = hist['Close'].iloc[-1]
                    
                    if mode == "daily":
                        now = datetime.now(TZ_OPERACIONAL)
                        days_back = 3 if now.weekday() == 0 else 1
                        target_day = now - timedelta(days=days_back)
                        alvo_data = target_day.replace(hour=17, minute=0, second=0, microsecond=0)
                        idx = hist.index.get_indexer([alvo_data], method='nearest')[0]
                        if idx >= len(hist) - 10: idx = 0 
                        price_past = hist['Close'].iloc[idx]
                        change = ((current_price - price_past) / price_past) * 100
                    else:
                        if len(hist) > PERIOD_OFFSET + 1:
                            price_past = hist['Close'].iloc[-(PERIOD_OFFSET + 1)]
                            change = ((current_price - price_past) / price_past) * 100
                        else:
                            price_past = hist['Close'].iloc[0]
                            change = ((current_price - price_past) / price_past) * 100
                    
                    data_results[f"{base}{quote}"] = change
                except Exception: 
                    continue
    
    strength_map, score_map = {}, {}
    for c in currencies:
        pos = [v for k, v in data_results.items() if k.startswith(c)]
        neg = [v for k, v in data_results.items() if k.endswith(c)]
        if not pos and not neg:
            strength_map[c] = 0; score_map[c] = 0; continue

        strength_map[c] = round((sum(pos) - sum(neg)) / 7, 3)
        win = sum(1 for v in pos if v > 0) + sum(1 for v in neg if v < 0)
        loss = sum(1 for v in pos if v < 0) + sum(1 for v in neg if v > 0)
        score_map[c] = win - loss
    return pd.Series(strength_map), pd.Series(score_map)

# ==============================================================================
# LOOP PRINCIPAL (RODA EM SEGUNDO PLANO)
# ==============================================================================
def background_loop():
    print("🚀 Motor Iniciado em Background...")
    while True:
        try:
            now = datetime.now(TZ_OPERACIONAL)
            
            # Verifica se é múltiplo de 5 minutos
            if now.minute % 5 == 0:
                print(f"\n⚡ INICIANDO CÁLCULO: {now.strftime('%H:%M:%S')}")
                if not DATABASE_URL:
                    print("❌ ERRO: DATABASE_URL não encontrada.")
                else:
                    s1h, sc1h = calculate_strength("1h")
                    s4h, sc4h = calculate_strength("4h")
                    sd, scd = calculate_strength("daily")
                    save_to_db(now, s1h, sc1h, s4h, sc4h, sd, scd)
                
                # Dorme 65 segundos para garantir que saímos do minuto atual e não calcular 2x
                time.sleep(65)
            else:
                # Se não for a hora, espera 15 segundos e checa de novo
                print(f"💤 Aguardando janela de 5 min... [{now.strftime('%H:%M:%S')}]")
                time.sleep(15)

        except Exception as e:
            print(f"❌ Erro no loop: {e}")
            time.sleep(60)

# ==============================================================================
# INICIALIZAÇÃO
# ==============================================================================
if __name__ == "__main__":
    # Inicia o loop de cálculo em uma thread separada (paralelo)
    t = threading.Thread(target=background_loop)
    t.start()
    
    # Inicia o servidor web (para o Render ficar feliz)
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)