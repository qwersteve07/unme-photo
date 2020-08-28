import React, { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import firebase from "firebase";
import liff from "@line/liff";

firebase.initializeApp({
  apiKey: "AIzaSyBu6AZ7U-mXlw9pInObwtaCuW02u01-32M",
  authDomain: "unme-test-8e49b.firebaseapp.com",
  databaseURL: "https://unme-test-8e49b.firebaseio.com",
  projectId: "unme-test-8e49b",
  storageBucket: "unme-test-8e49b.appspot.com",
  messagingSenderId: "586093179471",
  appId: "1:586093179471:web:e2a59d8701fa9b71fe303a",
  measurementId: "G-PSHFT5M5QD",
});

const ImageBlock = styled.div`
  width: 100%;
  margin: 10px;
  box-sizing: border-box;
  border: ${(props) =>
    props.pickList.indexOf(props.id) !== -1
      ? "4px solid red"
      : "4px solid transparent"};
`;
const Image = styled.img`
  width: 100%;
`;

const List = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const Checkbox = styled.div`
  display: none;
`;

const Button = styled.div`
  position: fixed;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 15px;
  background: white;
  bottom: 5vh;
  right: 4vw;
  cursor: pointer;
`;
const App = () => {
  const [pickList, setPickList] = useState([]);
  const [click, setClick] = useState(true);
  const [finish, setFinish] = useState(false);
  const [lineInit, setLineInit] = useState(false);
  const [userPick, setUserPick] = useState([]);

  // import all images
  const importAll = (r) => {
    return r.keys().map(r);
  };

  const imagesList = importAll(require.context("images", false, /\.png$/));
  const imagesId = imagesList.map((img) =>
    img.split("/")[3].split(".").shift()
  );

  // Initialize Firebase
  const database = firebase.database();

  useEffect(() => {
    // init LIFF
    liff.init({ liffId: "1654658636-pjJ15WdX" }).then(() => {
      setLineInit(true);
    });
  }, []);

  const checkImagePick = (id) => {
    let newList = pickList;
    if (newList.indexOf(id) !== -1) {
      newList.splice(newList.indexOf(id), 1);
    } else {
      newList.push(id);
    }
    setPickList(newList);
    setClick(!click);
  };

  const imageBlock = useCallback(() => {
    return imagesList.map((img, index) => {
      return (
        <ImageBlock pickList={pickList} id={imagesId[index]}>
          <Checkbox type="checkbox" id={imagesId[index]} />
          <label htmlFor={imagesId[index]}>
            <Image
              src={img}
              alt={imagesId[index]}
              onClick={() => checkImagePick(imagesId[index])}
            />
          </label>
        </ImageBlock>
      );
    });
  }, [click]);

  const sendLIFFMessage = (value) => {
    if (!liff.isInClient()) {
      console.log("abc");
    } else {
      liff
        .sendMessages([
          {
            type: "text",
            text: `我已選擇了${value}\n`,
          },
        ])
        .then(function () {
          liff.closeWindow();
        });
    }
  };

  const pushResult = () => {
    return new Promise((resolve, reject) => {
      database.ref("/voiceTube").push(pickList);
      resolve();
    });
  };

  const calculate = () => {
    return new Promise((resolve, reject) => {
      database.ref("/").once("value", (e) => {
        const lists = Object.entries(e.val().voiceTube).map((x) => x[1]);
        // const x = imagesId.map((id) => {
        //   return {
        //     name: id,
        //     count: 0,
        //   };
        // });
        console.log(lists);
        resolve(lists);
      });
    });
  };

  const onClick = () => {
    pushResult()
      .then(calculate)
      .then((value) => {
        console.log(userPick);
        setFinish(true);
        sendLIFFMessage(value.pop());
      });
  };

  if (!lineInit) return <>loading...</>;
  return (
    <List>
      {imageBlock()}
      <Button
        onClick={onClick}
        style={{ pointerEvents: finish ? "none" : "inherit" }}
      >
        {finish ? "已完成" : "確認"}
      </Button>
    </List>
  );
};

export default App;
