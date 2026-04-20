# Trakteer
## HTML Embed
### Basic Button
<script type='text/javascript' src='https://edge-cdn.trakteer.id/js/embed/trbtn.min.js?v=14-05-2025'></script><script type='text/javascript'>(function(){var trbtnId=trbtn.init('ini bisa diganti','#be1e2d','https://trakteer.id/jawatch/tip','https://edge-cdn.trakteer.id/images/embed/trbtn-icon.png?v=14-05-2025','40');trbtn.draw(trbtnId);})();</script> 

### Image Button
<a href="https://trakteer.id/jawatch" target="_blank"><img id="wse-buttons-preview" src="https://edge-cdn.trakteer.id/images/embed/trbtn-red-1.png?v=14-05-2025" height="40" style="border: 0px; height: 40px; --darkreader-inline-border-top: 0px; --darkreader-inline-border-right: 0px; --darkreader-inline-border-bottom: 0px; --darkreader-inline-border-left: 0px;" alt="Trakteer Saya" data-darkreader-inline-border-top="" data-darkreader-inline-border-right="" data-darkreader-inline-border-bottom="" data-darkreader-inline-border-left=""></a>

### Overlay Button
<script type='text/javascript' src='https://edge-cdn.trakteer.id/js/trbtn-overlay.min.js?v=14-05-2025'></script><script type='text/javascript' class='troverlay'>(function() {var trbtnId = trbtnOverlay.init('Dukung Saya di Trakteer','#be1e2d','https://trakteer.id/v1/jawatch/tip/embed/modal','https://edge-cdn.trakteer.id/images/embed/trbtn-icon.png?v=14-05-2025','40','inline');trbtnOverlay.draw(trbtnId);})();</script>

## Api
My API Key
trapi-3zLvWlIaHPQPgqMhuM1OmVCD

### POST Quantity Given
API ini digunakan untuk melihat jumlah unit trakteer-an yang telah diberikan oleh supporter (berdasarkan email) selama 30 hari terakhir.
      
curl --request POST\
  --url 'https://api.trakteer.id/v1/public/quantity-given'\
  --header 'Accept: application/json'\
  --header 'X-Requested-With: XMLHttpRequest'\
  --header 'key: trapi-3zLvWlIaHPQPgqMhuM1OmVCD'\
  --data email='your_supporter_email@gmail.com'

    
➡️ Response
      
{
  "status": "success",
  "status_code": 200,
  "result": 10,
  "message": "OK"
}

Field	Type	Description
status	string	The status of the response (success or error).
status_code	int	The HTTP status code.
result	int	The number of Trakteer units given by supporters in the last 30 days.
message	string	A short message describing the response.

### GET Support History
API ini digunakan untuk mendapatkan riwayat trakteer-an yang kamu terima dari supporter.

Method	URL
GET	https://api.trakteer.id/v1/public/supports
➡️ Response
      
{
  "status": "success",
  "status_code": 200,
  "result": {
    "data": [
      {
        "creator_name": "Janessa West",
        "support_message": "Selalu berkarya bang!",
        "quantity": 2,
        "amount": 30000,
        "unit_name": "Kopi",
        "status": "success",
        "updated_at": "2025-03-11 13:44:07",
        "payment_method": "OVO",
        "order_id": "j1ee3b42-35f8-5cb1-a316-a405bee9d3a1"
      },
      {
        "creator_name": "Sidney Torp",
        "support_message": "Karena bilang makasih aja gacukup 😁😁",
        "quantity": 1,
        "amount": 15000,
        "unit_name": "Kopi",
        "status": "success",
        "updated_at": "2025-02-11 00:21:37",
        "payment_method": "QRIS",
        "order_id": "46ef4334-3e57-53f1-9423-7222d2b1ff55"
      }
    ]
  },
  "message": "OK"
}

    
Field	Type	Description
status	string	The status of the response (success or error).
status_code	int	The HTTP status code.
result	object	Contains the support history data.
result.data	array	List of support transactions.
result.data[].creator_name	string	The name of the creator receiving the support.
result.data[].support_message	string	The message left by the supporter.
result.data[].quantity	int	Number of units supported.
result.data[].amount	int	Total amount of support in rupiah .
result.data[].unit_name	string	The unit of support (unit trakteeran) (e.g., "Mie Ayam", "Kopi").
result.data[].status	string	Status of the transaction (success, pending, failed, refund).
result.data[].updated_at	string (datetime)	Last update timestamp of the transaction.
result.data[].is_guest	boolean	Is support using guest email / not login
(Only available with ?include=is_guest)
result.data[].reply_message	string	Creator's reply to the support message, null if none
(Only available with ?include=reply_message)
result.data[].net_amount	int	Final amount going to trakteer balance, after deducted by platfrom fee and payment gateway fee
(Only available with ?include=net_amount)
result.data[].payment_method	string	Payment method used. e.g., "OVO", "QRIS".
(Only available with ?include=payment_method)
result.data[].order_id	string	Unique identifier for the transaction order
(Only available with ?include=order_id)
result.data[].supporter_email	string	Email used by supporter if they checked the "Tampilkan email saya pada kreator" option, null if not available.
(Only available with ?include=supporter_email)
result.data[].updated_at_diff_label	string	Last update timestamp of the transaction in short version of human readable format.
(Only available with ?include=updated_at_diff_label)
message	string	A short message describing the response.

### GET Current Balance
API ini digunakan untuk melihat jumlah saldo yang dimiliki.
      
curl --request GET\
  --url 'https://api.trakteer.id/v1/public/current-balance'\
  --header 'Accept: application/json'\
  --header 'X-Requested-With: XMLHttpRequest'\
  --header 'key: trapi-3zLvWlIaHPQPgqMhuM1OmVCD'

    
Response
      
{
  "status": "success",
  "status_code": 200,
  "result": "6483.00",
  "message": "OK"
}

    
Field	Type	Description
status	string	The status of the response (success or error).
status_code	int	The HTTP status code.
result	string	Current balance amount, formatted to two decimal places.
message	string	A short message describing the response.

### GET Transaction History
API ini digunakan untuk mendapatkan riwayat trakteer-an yang telah kamu berikan kepada kreator.
Example
        
curl --request GET\
  --url 'https://api.trakteer.id/v1/public/transactions?limit=5&page=1'\
  --header 'Accept: application/json'\
  --header 'X-Requested-With: XMLHttpRequest'\
  --header 'key: trapi-3zLvWlIaHPQPgqMhuM1OmVCD'

      
➡️ Response
      
{
    "status": "success",
    "status_code": 200,
    "result": {
      "data": [
        {
          "supporter_name": "Seseorang",
          "support_message": "Sekali lagi",
          "quantity": 1,
          "amount": 15000,
          "unit_name": "Kopi",
          "updated_at": "2024-12-16 13:41:48"
        },
        {
          "supporter_name": "Janessa West",
          "support_message": "Yang semagat dong streamingnya",
          "quantity": 1,
          "amount": 15000,
          "unit_name": "Kopi",
          "updated_at": "2024-10-01 21:33:50"
        }
      ]
    },
    "message": "OK"
}

    
Field	Type	Description
status	string	The status of the response (success or error).
status_code	int	The HTTP status code.
result	object	Contains the support history data.
result.data	array	List of support transactions.
result.data[].supporter_name	string	The name of the supporter.
result.data[].support_message	string	The message left by the supporter.
result.data[].quantity	int	Number of units supported.
result.data[].amount	int	Total amount of support in rupiah.
result.data[].unit_name	string	The unit of support (unit trakteeran) (e.g., "Mie Ayam", "Kopi").
result.data[].updated_at	string (datetime)	Last update timestamp of the transaction.
result.data[].is_guest	boolean	Is support using guest email / not login
(Only available with ?include=is_guest)
result.data[].reply_message	string	Creator's reply to the support message, null if none
(Only available with ?include=reply_message)
result.data[].net_amount	int	Final amount going to trakteer balance, after deducted by platfrom fee and payment gateway fee
(Only available with ?include=net_amount)
result.data[].updated_at_diff_label	string	Last update timestamp of the transaction in short version of human readable format.
(Only available with ?include=updated_at_diff_label)
message	string	A short message describing the response.

## Websocket

My Channel ID
emRleDVteWVueHlqNWttZy50cnN0cmVhbS1TN01vNEN5T0FuZDlLcWt6cGRrZQ==

### Contoh Penggunaan
Javascript
<script src="https://assets.trakteer.id/js/trws.min.js"></script>
<script>
  // Get your channel ID in https://trakteer.id/manage/webhook/websocket
  const channelID = 'INPUT_YOUR_CHANNEL_ID_HERE';

  // Register Creator Channel ID
  TrakteerWS.register(channelID);

  // Function to handle on stream test notification event
  TrakteerWS.onStreamTest = (data) => {
    // WRITE YOUR HANDLER CODE HERE
  };

  // Function to handle on new traktiran notification event
  TrakteerWS.onNewTipSuccess = (data) => {
    // WRITE YOUR HANDLER CODE HERE
  };
</script>

### Contoh Struktur dan Isian Data
{
  "data": {
    "supporter_name": "Seseorang",
    "unit": "Cendol", 
    "quantity": 2,
    "supporter_message": "Selalu Berkarya!",
    "supporter_avatar": "https://edge-cdn.trakteer.id/images/mix/default-avatar.png",
    "unit_icon": "https://edge-cdn.trakteer.id/images/mix/mie-ayam.png",
    "price": "Rp 5.000",
    "media": {
      "gif": "3oEduQAsYcJKQH2XsI", // ID gif selection from Giphy
      "video": {
        "type": "tiktok", // Empty if youtube
        "id": "z3U0udLH974", // Youtube or Tiktok video ID
        "start": 0 // Start youtube video duration
      },
      "voice": "https://edge-cdn.trakteer.id/audio/vn-sample-cat-voice.mp3" // Voice note
    }
  }
}
