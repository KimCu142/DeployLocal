import { useNavigate } from "react-router-dom";
import { Button, Input, Space, Divider, message } from "antd";
import {
  UserOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { useContext, useState } from "react";
import styles from "./Login.module.css"; // Importing CSS module

import { Buffer } from "buffer";
import api from "../../config/axios";
import { AuthContext } from "../../components/AuthContext";
window.Buffer = Buffer; // Polyfill Buffer in the browser

const Login = () => {
  const navigate = useNavigate(); // Hook useNavigate to handle navigation
  const { setIsLoggedIn, setUsername, setUserRole } = useContext(AuthContext);
  const [username, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (values) => {
    values.preventDefault();

    try {
      const response = await api.post("account/login", { username, password });
      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("role", data.role);
      console.log(data);
      message.success("Login successful!");

      // Update AuthContext with new login information
      setIsLoggedIn(true);
      setUsername(data.username); // Update the username in context
      setUserRole(data.role);

      navigate("/");

      // if (data.role === "STAFF") {
      //   navigate("/staff-dashboard");
      // } else if (data.role === "BREEDER") {
      //   navigate("/breeder-dashboard");
      // } else {
      //   navigate("/");
      // }
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.message;
        message.error(`Login failed. : ${errorMessage}`);
        console.error("Login error:", error.response.data);
      } else {
        message.error("An unexpected error occurred.");
        console.error("Unexpected error:", error);
      }
    }
  };

  return (
    <div className={styles.loginpage}>
      <div className={styles.formContainer}>
        <div className={styles.col1}>
          <img
            src="src\assets\LoginPic.jpg"
            alt="Koi Fish"
            className={styles.image}
          />
        </div>

        <div className={`${styles.col2} ${styles.glass2}`}>
          <p className={styles.loginWords}>Welcome Back!</p>
          <form
            className={`${styles.loginForm} ${styles.glass}`}
            onSubmit={handleLogin}
          >
            {/* Username Input */}
            <Input
              placeholder="Enter your username"
              prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              className={`${styles.formItem}`}
              required
              value={username}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={{ width: "500px", height: "48px" }}
            />

            <br />
            <br />

            {/* Password Input with visibility toggle */}
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Input.Password
                placeholder="Enter your password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                className={`${styles.formItem}`}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "500px", height: "48px" }}
              />
            </Space>

            <br />

            {/* Login Button */}
            <Button
              className={styles.formItem2}
              type="primary"
              block
              htmlType="submit"
            >
              Login
            </Button>

            <Divider style={{ borderColor: "#A8A6A7" }}>Or</Divider>

            {/* Google Login Button */}
            <Button
              className={`${styles.loginGoogle} ${styles.formItem}`}
              block
            >
              <img
                src="https://th.bing.com/th/id/R.0dd54f853a1bffb0e9979f8146268af3?rik=qTQlRtQRV5AliQ&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fgoogle-logo-png-google-logo-icon-png-transparent-background-1000.png&ehk=VlcCHZ7jyV%2fCI7dZfbUl8Qb9%2f7uibkF6I6MBoqTtpRU%3d&risl=&pid=ImgRaw&r=0"
                alt="Google logo"
                width={25}
              />
              <span>Continue with Google</span>
            </Button>
          </form>

          <p className={styles.registerLink}>
            Do not have an account?{" "}
            <span
              className={styles.registerLinkText}
              onClick={() => navigate("/Register")}
              style={{ cursor: "pointer" }}
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
