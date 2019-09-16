#include <bluefruit.h>
#include <Adafruit_SSD1306.h>

// Device Name: Maximum 30 bytes
#define DEVICE_NAME "LINE Things Drink dispenser"

// User service UUID: Change this to your generated service UUID
#define USER_SERVICE_UUID "<YOUR_USER_SERVICE_UUID>"
// User service characteristics
#define WRITE_CHARACTERISTIC_UUID "E9062E71-9E62-4BC6-B0D3-35CDCD9B027B"
#define NOTIFY_CHARACTERISTIC_UUID "62FBD229-6EDD-4D1A-B554-5C4E1BB29169"

// PSDI Service UUID: Fixed value for Developer Trial
#define PSDI_SERVICE_UUID "e625601e-9e55-4597-a598-76018a0d293d"
#define PSDI_CHARACTERISTIC_UUID "26e2b12b-85f0-4f3f-9fdd-91d114270e6e"

#define BUTTON 29
#define LED1 7
#define LED2 17

// I2S Display
Adafruit_SSD1306 display(128, 64, &Wire, -1);

uint8_t userServiceUUID[16];
uint8_t psdiServiceUUID[16];
uint8_t psdiCharacteristicUUID[16];
uint8_t writeCharacteristicUUID[16];
uint8_t notifyCharacteristicUUID[16];

BLEService userService;
BLEService psdiService;
BLECharacteristic psdiCharacteristic;
BLECharacteristic notifyCharacteristic;
BLECharacteristic writeCharacteristic;

volatile int btnAction = 0;

// GPIO PIN
// MotorDriver1
int md1_in1 = 18;
int md1_in2 = 17;
int md1_in3 = 16;
int md1_in4 = 15;
int md1_enA = 14;
int md1_enB = 13;
// MotorDriver2
//int md2_in1 = 12;
//int md2_in2 = 11;
//int md2_in3 = 10;
//int md2_in4 = 9;
//int md2_enA = 8;
//int md2_enB = 7;

// Dispense time
int dispense_time = 5000;

void setup() {
  // Serial init
  Serial.begin(115200);
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  digitalWrite(LED1, 0);
  digitalWrite(LED2, 0);
  pinMode(BUTTON, INPUT_PULLUP);
  attachInterrupt(BUTTON, buttonAction, CHANGE);

  // Display init
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.display();

  initializeMotor();

  Bluefruit.begin();
  Bluefruit.setName(DEVICE_NAME);

  setupServices();
  startAdvertising();
  initializeDisplay();
}

void initializeDisplay() {
  // 起動メッセージを表示
  display.clearDisplay();       // ディスプレイのバッファを初期化
  display.setTextSize(1);       // テキストサイズ 1
  display.setTextColor(WHITE);  // Color White
  display.setCursor(0, 10);     // X=0, Y=10
  display.println("LINE Things");
  display.println("Hello world!");
  display.display();            // ディスプレイを更新
  delay(500);
}

void initializeMotor() {
  // setup GPIO pin for Motor Driver
  pinMode(md1_enA, OUTPUT);
  pinMode(md1_enB, OUTPUT);
  pinMode(md1_in1, OUTPUT);
  pinMode(md1_in2, OUTPUT);
  pinMode(md1_in3, OUTPUT);
  pinMode(md1_in4, OUTPUT); 
//  pinMode(md2_enA, OUTPUT);
//  pinMode(md2_enB, OUTPUT);
//  pinMode(md2_in1, OUTPUT);
//  pinMode(md2_in2, OUTPUT);
//  pinMode(md2_in3, OUTPUT);
//  pinMode(md2_in4, OUTPUT); 
  // Switch to LOW
  analogWrite(md1_enA, 0);
  analogWrite(md1_enB, 0);
  digitalWrite(md1_in1, LOW);
  digitalWrite(md1_in2, LOW);
  digitalWrite(md1_in3, LOW);
  digitalWrite(md1_in4, LOW);
//  analogWrite(md2_enA, 0);
//  analogWrite(md2_enB, 0);
//  digitalWrite(md2_in1, LOW);
//  digitalWrite(md2_in2, LOW);
//  digitalWrite(md2_in3, LOW);
//  digitalWrite(md2_in4, LOW);
  
}

void loop() {
  uint8_t btnRead;

  while (btnAction > 0) {
    btnRead = !digitalRead(BUTTON);
    btnAction = 0;
    notifyCharacteristic.notify(&btnRead, sizeof(btnRead));
    delay(20);
  }
}

void setupServices(void) {
  // Convert String UUID to raw UUID bytes
  strUUID2Bytes(USER_SERVICE_UUID, userServiceUUID);
  strUUID2Bytes(PSDI_SERVICE_UUID, psdiServiceUUID);
  strUUID2Bytes(PSDI_CHARACTERISTIC_UUID, psdiCharacteristicUUID);
  strUUID2Bytes(WRITE_CHARACTERISTIC_UUID, writeCharacteristicUUID);
  strUUID2Bytes(NOTIFY_CHARACTERISTIC_UUID, notifyCharacteristicUUID);

  // Setup User Service
  userService = BLEService(userServiceUUID);
  userService.begin();

  writeCharacteristic = BLECharacteristic(writeCharacteristicUUID);
  writeCharacteristic.setProperties(CHR_PROPS_WRITE);
  writeCharacteristic.setWriteCallback(writeLEDCallback);
  writeCharacteristic.setPermission(SECMODE_ENC_NO_MITM, SECMODE_ENC_NO_MITM);
  writeCharacteristic.setFixedLen(1);
  writeCharacteristic.begin();

  notifyCharacteristic = BLECharacteristic(notifyCharacteristicUUID);
  notifyCharacteristic.setProperties(CHR_PROPS_NOTIFY);
  notifyCharacteristic.setPermission(SECMODE_ENC_NO_MITM, SECMODE_NO_ACCESS);
  notifyCharacteristic.setFixedLen(1);
  notifyCharacteristic.begin();

  // Setup PSDI Service
  psdiService = BLEService(psdiServiceUUID);
  psdiService.begin();

  psdiCharacteristic = BLECharacteristic(psdiCharacteristicUUID);
  psdiCharacteristic.setProperties(CHR_PROPS_READ);
  psdiCharacteristic.setPermission(SECMODE_ENC_NO_MITM, SECMODE_NO_ACCESS);
  psdiCharacteristic.setFixedLen(sizeof(uint32_t) * 2);
  psdiCharacteristic.begin();

  // Set PSDI (Product Specific Device ID) value
  uint32_t deviceAddr[] = { NRF_FICR->DEVICEADDR[0], NRF_FICR->DEVICEADDR[1] };
  psdiCharacteristic.write(deviceAddr, sizeof(deviceAddr));
}

void startAdvertising(void) {
  // Start Advertising
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();
  Bluefruit.Advertising.addService(userService);
  Bluefruit.ScanResponse.addName();
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.start(0);
}

void buttonAction() {
  btnAction++;
}

void writeLEDCallback(uint16_t conn_hdl, BLECharacteristic* chr, uint8_t* data, uint16_t len) {
  // メッセージを表示
  display.clearDisplay();       // ディスプレイのバッファを初期化
  display.setTextSize(2);       // テキストサイズ 1
  display.setTextColor(WHITE);  // Color White
  display.setCursor(0, 10);     // X=0, Y=10
  display.println("Got write command");
  display.display();            // ディスプレイを更新
  //
  doDrinkDispense(data);
  initializeDisplay();
}

void doDrinkDispense(uint8_t* data) {
  int value = *data;
  delay(200);
  digitalWrite(LED2, 1);
  Serial.println("Begin dispense drink!");
  Serial.println("Dispense drink [" + String(value) + "]");
  // メッセージを表示
  display.clearDisplay();       // ディスプレイのバッファを初期化
  display.setTextSize(2);       // テキストサイズ 1
  display.setTextColor(WHITE);  // Color White
  display.setCursor(0, 10);     // X=0, Y=10
//  display.println("LINE Things");
  display.println("drink [" + String(value) + "]");
  display.display();            // ディスプレイを更新
  // Dispense drink
  switch(value) {
    case 0:
      dispense_drink0();
      break;
    case 1:
      dispense_drink1();
      break;
//    case 2:
//      dispense_drink2();
//      break;
//    case 3:
//      dispense_drink3();
//      break;
    default:
      Serial.println("No suitable drink dispenser: ");
  }
  // Switch to LOW
  analogWrite(md1_enA, 0);
  analogWrite(md1_enB, 0);
  digitalWrite(md1_in1, LOW);
  digitalWrite(md1_in2, LOW);
  digitalWrite(md1_in3, LOW);
  digitalWrite(md1_in4, LOW);
//  analogWrite(md2_enA, 0);
//  analogWrite(md2_enB, 0);
//  digitalWrite(md2_in1, LOW);
//  digitalWrite(md2_in2, LOW);
//  digitalWrite(md2_in3, LOW);
//  digitalWrite(md2_in4, LOW);
  delay(500);
  digitalWrite(LED2, 0);
}

void dispense_drink0() {
  digitalWrite(md1_in1, HIGH);
  digitalWrite(md1_in2, LOW);
  digitalWrite(md1_in3, LOW);
  digitalWrite(md1_in4, LOW);
  analogWrite(md1_enA, 255);
  analogWrite(md1_enB, 0);
  delay(dispense_time);
}

void dispense_drink1() {
  digitalWrite(md1_in1, LOW);
  digitalWrite(md1_in2, LOW);
  digitalWrite(md1_in3, LOW);
  digitalWrite(md1_in4, HIGH);
  analogWrite(md1_enA, 0);
  analogWrite(md1_enB, 255);
  delay(dispense_time);
}
//void dispense_drink2() {
//  digitalWrite(md2_in1, HIGH);
//  digitalWrite(md2_in2, LOW);
//  digitalWrite(md2_in3, LOW);
//  digitalWrite(md2_in4, LOW);
//  analogWrite(md2_enA, 255);
//  analogWrite(md2_enB, 0);
//  delay(dispense_time);
//}
//
//void dispense_drink3() {
//  digitalWrite(md2_in1, LOW);
//  digitalWrite(md2_in2, LOW);
//  digitalWrite(md2_in3, HIGH);
//  digitalWrite(md2_in4, HIGH);
//  analogWrite(md2_enA, 0);
//  analogWrite(md2_enB, 255);
//  delay(dispense_time);
//}

// UUID Converter
void strUUID2Bytes(String strUUID, uint8_t binUUID[]) {
  String hexString = String(strUUID);
  hexString.replace("-", "");

  for (int i = 16; i != 0 ; i--) {
    binUUID[i - 1] = hex2c(hexString[(16 - i) * 2], hexString[((16 - i) * 2) + 1]);
  }
}

char hex2c(char c1, char c2) {
  return (nibble2c(c1) << 4) + nibble2c(c2);
}

char nibble2c(char c) {
  if ((c >= '0') && (c <= '9'))
    return c - '0';
  if ((c >= 'A') && (c <= 'F'))
    return c + 10 - 'A';
  if ((c >= 'a') && (c <= 'f'))
    return c + 10 - 'a';
  return 0;
}
