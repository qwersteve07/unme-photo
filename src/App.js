import React, { useState, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import firebase from "firebase";
import { get, flatten, uniq } from "lodash";
import liff from "@line/liff";
import "lazysizes";

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
  position: relative;
  &:before {
    ${(props) =>
      props.pickList.indexOf(props.id) !== -1
        ? `content: "已選擇";
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 30px;
    color: white;
    background: rgba(18, 132, 255, 0.5);
    width: 100%;
    height: 100%;
    font-family:PingFang TC, Noto Sans CJK TC, Noto Sans TC, Microsoft JhengHei;
    font-weight: bold;
    letter-spacing: 2px;
    position: absolute;
    pointer-events: none`
        : ""}
  }
  border: $4px solid transparent;
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
  const pickRef = useRef("");

  // 每次皆需做替換！！
  // 記得確認現在的寫入規則是否超時 https://console.firebase.google.com/u/0/project/unme-test-8e49b/database/unme-test-8e49b/rules
  const CURRENT_PROJECT = "MAYO";

  // import all images
  const importAll = (r) => {
    return r.keys().map(r);
  };
  const imagesList = importAll(
    require.context("images", false, /\.(jpg|png)$/)
  );
  const imagesId = imagesList.map((img) => {
    return img.split("/").pop().split(".").shift();
  });

  // Initialize Firebase
  const database = firebase.database();

  useEffect(() => {
    database.ref("/").on("value", (e) => {
      const lists = Object.entries(get(e.val(), CURRENT_PROJECT, "")).map(
        (x) => x[1]
      );
      pickRef.current = lists;
    });
  }, []);

  useEffect(() => {
    // init LIFF
    liff.init({ liffId: "1655422524-z7Y2doDm" }).then(() => {
      setLineInit(true);
    });
  }, []);

  // pick images
  const checkImagePick = (id) => {
    let newList = pickList;
    if (newList.indexOf(id) !== -1) {
      newList.splice(newList.indexOf(id), 1);
    } else {
      newList.push(id);
    }
    setPickList(() => newList);
    setClick(!click);
  };

  const imageBlock = useCallback(() => {
    return imagesList.map((img, index) => {
      return (
        <ImageBlock pickList={pickList} id={imagesId[index]} key={index}>
          <Checkbox type="checkbox" id={imagesId[index]} />
          <label htmlFor={imagesId[index]}>
            <Image
              data-src={img}
              alt={imagesId[index]}
              onClick={() => checkImagePick(imagesId[index])}
              className="lazyload"
            />
          </label>
        </ImageBlock>
      );
    });
  }, [click]);

  // send liff message after click button
  const sendLIFFMessage = (value) => {
    if (!liff.isInClient()) {
      console.log("is not at mobile");
    } else {
      const totalText = () => {
        const text = value.total.map((t) => {
          return `${t.name}： ${t.count}張\n`;
        });
        return text.join("");
      };
      liff
        .sendMessages([
          {
            type: "text",
            text: `我已選擇了${value.picked.pop()}`,
          },
          {
            type: "text",
            text: `現在的統計為 - \n${totalText()}`,
          },
        ])
        .then(() => {
          liff.closeWindow();
        })
        .catch((err) => {
          console.log("error", err);
        });
    }
  };

  const onClick = () => {
    return new Promise((resolve, reject) => {
      database.ref(`/${CURRENT_PROJECT}`).push(pickList);
      resolve();
    })
      .then(() => {
        const getAllPicks = flatten(pickRef.current);
        const getUniqPicks = uniq(getAllPicks);
        let counts = [];
        getUniqPicks.map((pick) => {
          counts.push({
            name: pick,
            count: getAllPicks.filter((picks) => picks === pick).length,
          });
        });
        counts.sort((a, b) => {
          let numbers = (num) => {
            let result = num.name.split("_")[1];
            if (result.includes("-")) return result.split("-")[0];
            return result;
          };
          return numbers(a) - numbers(b);
        });
        return {
          picked: pickRef.current,
          total: counts,
        };
      })
      .then((value) => {
        setFinish(true);
        sendLIFFMessage(value);
        console.log(value);
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
