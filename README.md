# 🛒 E-Commerce Web Application (Full Stack MERN)

This is a full-stack **E-Commerce Web Application** with three main modules:

- **Frontend** – User-facing shopping website  
- **Admin Panel** – Admin dashboard to manage products, orders, and users  
- **Backend** – Server-side REST APIs  

Frontend and Admin are built using **React.js (Vite)** and Backend is built using **Node.js (Express)**.

---

## 📁 Project Structure



---

## 🚀 Tech Stack

**Frontend & Admin**
- React.js (Vite)
- Tailwind CSS / CSS
- React Router DOM
- Axios

**Backend**
- Node.js
- Express.js
- MongoDB (Database)
- JWT Authentication
- CORS

---

## ⚙️ Installation Steps

Clone the repository:

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```



# Frontend
```
cd frontend
npm install
```

# Admin
```
cd ../admin
npm install
```

# Backend
```
cd ../backend
npm install
```


# Create .env file
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_NAME= your cloudinary cloud name
CLOUDINARY_API_KEY= your cloudinary cloud name
CLOUDINARY_API_SECRET= your cloudinary cloud name
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Shiprocket credentials/pickup configuration are managed from `Admin -> Settings` per admin account (not from `.env`).

