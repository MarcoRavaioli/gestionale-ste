#!/bin/bash

BASE_URL="http://localhost:3000"

echo "============================================="
echo "1. CREAZIONE CLIENTE (POST)"
echo "Creiamo il cliente 'Mario Rossi'"
echo "============================================="
# Salviamo la risposta per estrarre l'ID dopo? Per ora facciamo visuale.
curl -i -X POST "$BASE_URL/cliente" \
     -H "Content-Type: application/json" \
     -d '{"nome": "Mario Rossi", "email": "mario@test.com", "telefono": "3331234567"}'

echo -e "\n\n"

echo "============================================="
echo "2. LETTURA TUTTI I CLIENTI (GET)"
echo "Dovremmo vedere la lista contenente Mario Rossi"
echo "============================================="
curl -i -X GET "$BASE_URL/cliente"

echo -e "\n\n"

echo "============================================="
echo "3. MODIFICA CLIENTE (PATCH)"
echo "Cambiamo il telefono a Mario (assumendo ID=1)"
echo "============================================="
curl -i -X PATCH "$BASE_URL/cliente/1" \
     -H "Content-Type: application/json" \
     -d '{"telefono": "999888777"}'

echo -e "\n\n"

echo "============================================="
echo "4. VERIFICA MODIFICA (GET ONE)"
echo "Controlliamo se il numero è cambiato"
echo "============================================="
curl -i -X GET "$BASE_URL/cliente/1"

echo -e "\n\n"

echo "============================================="
echo "5. CANCELLAZIONE (DELETE)"
echo "Eliminiamo Mario Rossi (ID=1)"
echo "============================================="
curl -i -X DELETE "$BASE_URL/cliente/1"

echo -e "\n\n"

echo "============================================="
echo "6. VERIFICA CANCELLAZIONE (GET ONE)"
echo "Dovrebbe dare errore o vuoto"
echo "============================================="
curl -i -X GET "$BASE_URL/cliente/1"

echo -e "\n\nTest Completato."

echo "1. CREO UN APPUNTAMENTO per il Cliente ID 999"
# Nota la data in formato ISO
curl -i -X POST "$BASE_URL/appuntamento" \
     -H "Content-Type: application/json" \
     -d '{"nome": "Visita Controllo", "data_ora": "2025-12-25T15:30:00.000Z", "clienteId": 999, "descrizione": "Controllo posturale"}'

echo -e "\n\n2. LEGGO GLI APPUNTAMENTI (Devo vedere anche i dati del cliente)"
curl -i -X GET "$BASE_URL/appuntamento"