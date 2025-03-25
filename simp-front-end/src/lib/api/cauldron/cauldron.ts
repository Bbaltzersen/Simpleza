import axios from "axios";
import { Cauldron, CauldronCreate, CauldronUpdate, CauldronData, CauldronDataCreate, CauldronDataUpdate } from "@/lib/types/cauldron";

const API_BASE_URL = process.env.RECIPES_API_URL || "http://localhost:8020/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
