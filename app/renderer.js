// renderer.js
const { ipcRenderer } = require("electron");
const serialport = require("serialport");
const { SerialPort } = serialport;

let port;
let portPath;

const portPicker = document.getElementById("port-picker");
const connectButton = document.getElementById("connect-button");
const receivedData = document.getElementById("received-data");
const sendData = document.getElementById("send-data");
const sendButton = document.getElementById("send-button");
const sendButton2 = document.getElementById("send-button2");
const instruction = document.getElementById("instruction");

let image;

document.getElementById("reload-button").addEventListener("click", () => {
  // リロードメッセージをメインプロセスに送信してウィンドウをリロード
  // ESPを差し直ししたりした時はここを押す
  ipcRenderer.send("reload-window");
});

//接続しているポートを取得してポートピッカーに表示
//起動時に刺さってないとダメなので，付け外ししたらReload
function populatePorts() {
  SerialPort.list()
    .then((ports) => {
      ports.forEach((port) => {
        console.log("Port: ", port);
        const option = document.createElement("option");
        option.value = port.path;
        option.text = port.path;
        portPicker.add(option);
      });
    })
    .catch((err) => {
      console.error("Error listing ports:", err.message);
    });
}
populatePorts();

//DataPipettorからのメッセージをチェックして表示したりする関数
function checkMessage(recv_message) {
  if (recv_message.includes("image")) {
    imageDisplay.src = "images/" + recv_message;
    instruction.textContent = "Received Data :  " + recv_message;
  } else if (recv_message == "ACK") {
    console.log("Received ACK !");
    instruction.textContent = "Data Send to DataPipettor !";
  } else if (recv_message == "comSuccess") {
    console.log("comSuccess !");
    instruction.textContent = "DataPipettor Com Success!";
  } else {
    imageDisplay.src = "";
    imageDisplay.alt = "Received Message:" + recv_message;
    console.log("Received Message:", recv_message);
  }
}

portPicker.addEventListener("change", () => {
  portPath = portPicker.value;
  connectButton.disabled = false;
});

connectButton.addEventListener("click", () => {
  const portPath = document.getElementById("port-picker").value;
  console.log(portPath);
  const baudRate = document.getElementById("baud-rate").value;
  port = new SerialPort({ path: portPath, baudRate: parseInt(baudRate) });

  port.on("open", () => {
    console.log("Serial port opened");
    connectButton.disabled = true;
    sendButton.disabled = false;
  });

  // データを受信したときの処理
  port.on("data", (data) => {
    console.log("Received Data:", data.toString());
    //受け取ったデータを整形，なぜか色々なモノが混じるので要検証
    const cleanedData = data.toString().replace(/\r?\n|\r/g, "");
    const message = cleanedData.toString().trim();

    checkMessage(message);
    receivedData.textContent += "\n" + data.toString();
  });

  port.on("error", (err) => {
    console.error("Error:", err.message);
  });
});

sendButton.addEventListener("click", () => {
  const data = sendData.value;
  port.write(data); //データをESP側に渡す
  console.log("Send Data:", data.toString());
  sendData.value = ""; //送信後は入力欄をクリア
});

document.addEventListener("DOMContentLoaded", () => {
  // 画像選択セレクトボックスの変更を監視
  document
    .getElementById("optionSelect")
    .addEventListener("change", function () {
      const selectedOption = this.value; // 選択されたオプションの値を取得
      const imageDisplay = document.getElementById("imageDisplay"); // 画像を表示するimgタグを取得
      console.log(selectedOption);
      sendButton2.disabled = false;
      image = selectedOption;

      // 選択されたオプションに基づいて画像のパスを更新
      switch (selectedOption.includes("image")) {
        case true:
          imageDisplay.src = "images/" + selectedOption;
          break;
        default:
          imageDisplay.src = "images/default.jpg"; // 何も選択されていない場合は画像をクリア
          break;
      }
    });
});

sendButton2.addEventListener("click", () => {
  console.log("Send-Image :" + image);
  port.write(image); //データをESP側に渡す
  console.log("Send Data:", image);
});
