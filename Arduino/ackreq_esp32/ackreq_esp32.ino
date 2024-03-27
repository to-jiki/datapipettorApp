#include <Arduino.h>
#include <HardwareSerial.h>

//Define two Serial devices mapped to the two internal UARTs
HardwareSerial MySerial0(0);
// HardwareSerial MySerial1(1);

#define INTERVAL 1 * 1000  // 10 [s]
// #define SENDER
#define RECEIVER


int my_id;
int t = 0;

//control pin for circuit
const int CTRL_PIN = D3;
#define MYSERIAL_RATE0 115200

String recv;
/*--------------------------------------------------
  Setup function
  --------------------------------------------------*/
void setup() {


  Serial.begin(115200);
  while (!Serial)
    ;
  MySerial0.begin(MYSERIAL_RATE0, SERIAL_8N1, 10, 4);
  while (!MySerial0)
    ;
  pinMode(CTRL_PIN, OUTPUT);
  digitalWrite(CTRL_PIN, LOW);
}

#ifdef SENDER
void loop() {
  // 送信処理
  digitalWrite(CTRL_PIN, HIGH);
  MySerial0.println("REQ");
  MySerial0.flush();
  Serial.println("sended req!");
  digitalWrite(CTRL_PIN, LOW);

  delay(200);
}

#endif

#ifdef RECEIVER
/*--------------------------------------------------
//   --------------------------------------------------*/
void loop() {

  while(MySerial0.available() > 0) {
    String str  = MySerial0.readStringUntil('\n');
    Serial.println("Received!: ");
    Serial.println(str);
    // if (recv.substring(0, 3) == "REQ") {
    //   digitalWrite(CTRL_PIN, HIGH);
    //   MySerial0.print("ACK");
    //   MySerial0.flush();
    //   digitalWrite(CTRL_PIN, LOW);
    //   Serial.println("ACK sended");
    // }
  }
  delay(100);
}

#endif
