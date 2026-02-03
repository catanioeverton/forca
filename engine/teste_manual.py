import os
import json
import psycopg2
from datetime import datetime
from dotenv import load_dotenv
import pytz

# Carrega a senha do banco
load_dotenv()

# Dados Falsos para Teste
fake_data = {
    "metadata": {
        "last_update": datetime.now().strftime('%H:%M:%S'),
        "timestamp_full": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    },
    "setups": {
        "setup_1h": "EURUSD",
        "setup_4h": "GBPCHF",
        "setup_daily": "USDCAD"
    },
    "data": {
        "h1": {"EUR": 2.5, "USD": -1.2, "GBP": 0.5, "JPY": -0.8, "AUD": 1.1, "CAD": -0.5, "CHF": 0.2, "NZD": 0.1},
        "h4": {"EUR": 1.5, "USD": -0.5, "GBP": 1.2, "JPY": -1.5, "AUD": 0.8, "CAD": -0.2, "CHF": 0.1, "NZD": 0.0},
        "daily": {"EUR": 0.5, "USD": 0.1, "GBP": 0.2, "JPY": -0.3, "AUD": 0.1, "CAD": 0.0, "CHF": -0.1, "NZD": -0.2}
    },
    "scores": {
        "h1": {"EUR": 10, "USD": -5, "GBP": 3, "JPY": -2, "AUD": 4, "CAD": -1, "CHF": 1, "NZD": 0},
        "h4": {"EUR": 8, "USD": -2, "GBP": 5, "JPY": -6, "AUD": 3, "CAD": -1, "CHF": 0, "NZD": 0},
        "daily": {"EUR": 2, "USD": 1, "GBP": 1, "JPY": -1, "AUD": 0, "CAD": 0, "CHF": 0, "NZD": -1}
    }
}

try:
    # Conecta no Neon
    url = os.getenv("DATABASE_URL")
    if not url:
        print("❌ ERRO: Arquivo .env não encontrado ou vazio na pasta engine.")
        exit()
        
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    
    # Insere os dados
    print("💉 Injetando dados de teste...")
    cur.execute("INSERT INTO market_history (data_json) VALUES (%s)", (json.dumps(fake_data),))
    conn.commit()
    
    print("✅ Sucesso! Dados gravados. Verifique o site agora.")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Erro: {e}")