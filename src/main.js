import './style.css';
import { APP_URL } from "./config";
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem("accessToken")) {
    window.location.href =  `${APP_URL}/dashboard/dashboard.html`;
  }else{
    window.location.href = `${APP_URL}/login/login.html`;
  }
})