import { getFirestore } from "firebase/firestore";
import { fbApp } from "./firebase";

export const fbDb = () => getFirestore(fbApp());
