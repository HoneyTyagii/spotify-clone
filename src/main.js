import './style.css';
const APP_URL = import.meta.env.VITE_APP_URL;

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem("accessToken")) {
    window.location.href =  `https://honey-tyagi-spotify-clone.vercel.app/dashboard/dashboard.html`;
  }else{
    window.location.href = `https://honey-tyagi-spotify-clone.vercel.app/login/login.html`;
  }
})