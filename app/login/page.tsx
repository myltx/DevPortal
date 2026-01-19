"use client";

import React, { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    // Mock login logic
    setTimeout(() => {
      if (values.username === "admin" && values.password.length >= 6) {
        message.success("Login successful");
        // Set token (mock)
        localStorage.setItem("token", "fanqie-token");
        document.cookie = "token=fanqie-token; path=/";
        window.location.href = "/middle";
      } else {
        message.error("Invalid username or password (try admin/123456)");
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#2d3a4b",
      }}>
      <Card
        title="Login Form"
        style={{ width: 400, background: "rgba(255, 255, 255, 0.9)" }}>
        <Form
          name="login"
          initialValues={{ username: "admin", password: "123456" }} // Mock default
          onFinish={onFinish}>
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Please input your Username!" },
            ]}>
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please input your Password!" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
