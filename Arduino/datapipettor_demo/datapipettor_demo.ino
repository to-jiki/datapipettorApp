#include <Arduino.h>
#include <HardwareSerial.h>
#include <MsgPacketizer.h>


//ウェアラブルデバイスの状態管理関連
enum pipettorState {
  WAITING,                 //待機状態
  USB_SEDING,              //USB役割のやつが送り続ける
  HAVING_DATA_FROM_UNITY,  //unityからデータを受け取っている状態
  HAVING_DATA_FROM_USB,    //USB役割のやつから受けとってUnityへ渡したい受信側のUNITYへ渡したい状態
  DONE,
};
enum pipettorState pipettorState;

const uint8_t recv_index = 0x12;
const uint8_t send_index = 0x34;

//パケットデータ構造
struct PacketData {
  int header;            //状態制御用
  MsgPack::str_t sData;  //データ部分
  MSGPACK_DEFINE(header, sData);
};

//パケットのデータ格納用
int type;
String handledData = "";
String messageFromApp;  //data from Unity

HardwareSerial MySerial0(0);
#define MYSERIAL_RATE0 115200

//control pin for tri state buffur 受信回路の制御用
const int CTRL_PIN = D3;


bool recv_flag = false;
bool send_flag = false;
/*--------------------------------------------------
  Setup
  --------------------------------------------------*/
void setup() {
  pipettorState = WAITING;
  Serial.begin(115200);
  while (!Serial)
    ;
  MySerial0.begin(MYSERIAL_RATE0, SERIAL_8N1, 10, 4);//Pipettorのインターフェースへの送受信のPIN
  while (!MySerial0)
    ;
  pinMode(CTRL_PIN, OUTPUT);
  digitalWrite(CTRL_PIN, LOW);//LOWは受信状態

  MsgPacketizer::subscribe(MySerial0,
                           [&](const uint8_t index, MsgPack::Unpacker& unpacker) {
                             PacketData packetData;
                             unpacker.deserialize(packetData);
                             handledData = packetData.sData;
                             type = packetData.header;
                             recv_flag = true;
                           });
}


//Pipettorのインターフェースで送信するときに使う
void send_data(PacketData packetData) {
  digitalWrite(CTRL_PIN, HIGH);//HIGHで受信回路を切る
  MsgPacketizer::send(MySerial0, send_index, packetData);
  MySerial0.flush();//送り終わるまで待つ 必須
  digitalWrite(CTRL_PIN, LOW);
}

//接続したアプリ側とやり取りするときに使う
void sendToApp(String messageToApp) {
  //   Serial.print("received:");
  Serial.println(messageToApp);
}

//特定回数ACKを送る ここらへん適当に送ってるのでどうするかちゃんと考えるところ 今は使ってない
void sendAck() {
  int n = 0;
  while (n < 1000) {
    send_data(PacketData{ 99, "ACK" });
    n++;
  }
}


void loop() {
  MsgPacketizer::parse();        //pipettorパケット通信
  if (Serial.available() > 0) {  //Unityからの受信チェック
    messageFromApp = Serial.readStringUntil('\n');
    if (messageFromApp == "ACK") {
      type = 99;
      Serial.print("Received Ack!!");
      Serial.println();
    } else {
      type = 3;
      handledData = messageFromApp;
    }
    recv_flag = true;
  }

  //データを受信したとき
  if (recv_flag) {
    if (type == 1 && pipettorState == WAITING) {  //USB役割のデバイスがデータを受け取ったと
      pipettorState = USB_SEDING;
      sendToApp(handledData);
      send_flag = true;
      // sendAck();
    }
    if (type == 2 && pipettorState == WAITING) {
      pipettorState = HAVING_DATA_FROM_USB;  //USB役割のやつからデータを受け取ったときにこの状態になる
      send_flag = true;
    }

    if (type == 3) {  //unityからACK以外の実データを受け取ったとき
      pipettorState = HAVING_DATA_FROM_UNITY;
      sendToApp("ACK");  //コンソールに受け取ったと返す
      send_flag = true;
    }

    if (type == 99) {//ACKをい受け取ったときの挙動
      if (pipettorState == HAVING_DATA_FROM_UNITY) {  //HAVING_DATA_FROM_UNITY状態のやつがACKを受け取ったとき
        sendToApp("comSuccess");
      }
      send_flag = false;
      handledData = "";
      pipettorState = WAITING;
    }
    recv_flag = false;  //
  }

  //送信Flagが立ってるとき
  if (send_flag) {
    if (pipettorState == USB_SEDING) send_data(PacketData{ 2, handledData });
    if (pipettorState == HAVING_DATA_FROM_UNITY) send_data(PacketData{ 1, handledData });
    if (pipettorState == HAVING_DATA_FROM_USB) {
      sendToApp(handledData);
      send_flag = false;
      pipettorState = DONE;//
    }
  }
  delay(200);
}
