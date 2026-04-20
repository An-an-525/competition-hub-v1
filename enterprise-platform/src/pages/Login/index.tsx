import React from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { LoginParams } from '../../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form] = Form.useForm();

  const handleLogin = (values: LoginParams) => {
    const result = login(values);
    if (result.success) {
      message.success(result.message);
      navigate('/dashboard');
    } else {
      message.error(result.message);
    }
  };

  return (
    <div className="login-page">
      {/* 装饰性浮动元素 */}
      <div className="login-decor login-decor-1" />
      <div className="login-decor login-decor-2" />
      <div className="login-decor login-decor-3" />

      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <BankOutlined />
          </div>
          <h1>企业协作平台</h1>
          <p className="login-subtitle">高效协作，共创未来</p>
        </div>
        <Form
          form={form}
          onFinish={handleLogin}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
              placeholder="用户名"
              className="login-input"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
              placeholder="密码"
              className="login-input"
            />
          </Form.Item>
          <Form.Item>
            <div className="login-options">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <a className="login-forgot-link">忘记密码?</a>
            </div>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="login-btn"
            >
              登 录
            </Button>
          </Form.Item>
          <div className="login-register-link">
            <span>还没有账号？</span>
            <Link to="/register">立即注册</Link>
          </div>
        </Form>
        <div className="login-demo-info">
          <div className="demo-info-title">演示账号</div>
          <div className="demo-info-row">
            <span className="demo-info-label">管理员</span>
            <span className="demo-info-value">admin / admin123</span>
          </div>
          <div className="demo-info-row">
            <span className="demo-info-label">普通用户</span>
            <span className="demo-info-value">lisi / 123456</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
