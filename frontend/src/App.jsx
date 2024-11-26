import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./App.css";

const socket = io("http://localhost:5005");

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between Login and Register

  useEffect(() => {
    if (token) {
      const fetchUser = async () => {
        try {
          const { data } = await axios.get("http://localhost:5005/auth/user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsername(data.username);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error verifying token:", error.message);
        }
      };
      fetchUser();
    }

    socket.on("receiveMessage", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get("http://localhost:5005/messages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(data.messages);
      } catch (error) {
        console.error("Failed to fetch messages:", error.message);
      }
    };

    if (token) {
      fetchMessages();
    }
  }, [token]);

  const handleLogin = async (loginData) => {
    try {
      const { data } = await axios.post(
        "http://localhost:5005/auth/login",
        loginData
      );
      setToken(data.token);
      localStorage.setItem("token", data.token);
      setUsername(data.username);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };

  const handleRegister = async (registerData) => {
    try {
      const { data } = await axios.post(
        "http://localhost:5005/auth/register",
        registerData
      );
      alert("Registration successful! Please login.");
      setIsRegistering(false); // Switch to login form after successful registration
    } catch (error) {
      console.error("Registration failed:", error.message);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    // Emit the message to the server via Socket.IO
    const newMessage = {
      content: message.trim(),
      sender: username, // Assume the sender is identified by username
    };

    socket.emit("sendMessage", newMessage);

    // Optimistically update the UI
    setMessages((prevMessages) => [
      ...prevMessages,
      { ...newMessage, isOptimistic: true },
    ]);
    setMessage("");
  };

  useEffect(() => {
    socket.on("newMessage", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, []);

  return (
    <div className="chat-container">
      {!isAuthenticated ? (
        isRegistering ? (
          <RegisterForm
            onRegister={handleRegister}
            onSwitch={() => setIsRegistering(false)}
          />
        ) : (
          <LoginForm
            onLogin={handleLogin}
            onSwitch={() => setIsRegistering(true)}
          />
        )
      ) : (
        <>
          <div className="header">
            <h1>Chat App</h1>
            <p>Welcome, {username}!</p>
          </div>
          <div className="chat-box">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender === username ? "own" : ""}`}
              >
                <strong>{msg.sender}:</strong> {msg.content}
              </div>
            ))}
          </div>
          <div className="input-container">
            <input
              type="text"
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="message-input"
            />
            <button onClick={sendMessage} className="send-button">
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const LoginForm = ({ onLogin, onSwitch }) => {
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(loginData);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Login</h2>
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={loginData.username}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={loginData.password}
        onChange={handleChange}
        required
      />
      <button type="submit" className="login-button">
        Login
      </button>
      <p onClick={onSwitch} className="switch-link">
        Don't have an account? Register
      </p>
    </form>
  );
};

const RegisterForm = ({ onRegister, onSwitch }) => {
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(registerData);
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <h2>Register</h2>
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={registerData.username}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={registerData.password}
        onChange={handleChange}
        required
      />
      <button type="submit" className="register-button">
        Register
      </button>
      <p onClick={onSwitch} className="switch-link">
        Already have an account? Login
      </p>
    </form>
  );
};

export default App;
