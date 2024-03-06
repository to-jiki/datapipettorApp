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
  // リロードメッセージをメインプロセスに送信
  ipcRenderer.send("reload-window");
});

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

function checkMessage(recv_message) {
  if (recv_message == "image1.jpg") {
    imageDisplay.src = "images/image1.jpg";
  } else if (recv_message == "image2.jpg") {
    imageDisplay.src = "images/image2.jpg";
  } else if (recv_message == "image3.jpg") {
    imageDisplay.src = "images/image3.jpg";
  } else {
    imageDisplay.src = "";
    imageDisplay.alt = "Received Message:" + recv_message;
    console.log("Received Message:", recv_message);
  }

  instruction.textContent = "Received Data :  " + recv_message;
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

    const cleanedData = data.toString().replace(/\r?\n|\r/g, "");
    const message = cleanedData.toString().trim();

    if (message == "ACK") {
      console.log("Received ACK !");
      instruction.textContent = "Data Send to DataPipettor !";
    }
    if (message == "comSuccess") {
      console.log("comSuccess !");
      instruction.textContent = "DataPipettor Com Success!";
    }
    receivedData.textContent += "\n" + data.toString();
  });

  port.on("error", (err) => {
    console.error("Error:", err.message);
  });
});

sendButton.addEventListener("click", () => {
  const data = sendData.value;
  port.write(data);
  console.log("Send Data:", data.toString());
  sendData.value = "";
});

document.addEventListener("DOMContentLoaded", () => {
  // 画像選択セレクトボックスの変更を監視
  document
    .getElementById("optionSelect")
    .addEventListener("change", function () {
      const selectedOption = this.value; // 選択されたオプションの値を取得
      const imageDisplay = document.getElementById("imageDisplay"); // 画像を表示するimgタグを取得
      // console.log(selectedOption);
      // sendButton2.disabled = false;
      image = selectedOption;

      // 選択されたオプションに基づいて画像のパスを更新
      switch (selectedOption) {
        case "image1.jpg":
          imageDisplay.src = "images/image1.jpg";
          break;
        case "image2.jpg":
          imageDisplay.src = "images/image2.jpg";
          break;
        case "image3.jpg":
          imageDisplay.src = "images/image3.jpg";
          break;
        // 必要に応じて他のケースを追加
        default:
          imageDisplay.src = ""; // 何も選択されていない場合は画像をクリア
          break;
      }
    });
});

sendButton2.addEventListener("click", () => {
  console.log("Send-Image :" + image);
  port.write(image);
  console.log("Send Data:", image);
});
