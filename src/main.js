import './style.css';
const APP_URL = import.meta.env.VITE_APP_URL;

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem("accessToken")) {
    window.location.href =  `../dashboard/dashboard.html`;
  }else{
    window.location.href = `../login/login.html`;
  }
})