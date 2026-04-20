import React from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { RegisterParams } from '../../types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [form] = Form.useForm();

  const handleRegister = (values: RegisterParams) => {
    const result = register(values);
    if (result.success) {
      message.success(result.message);
      navigate('/dashboard');
    } else {
      message.error(result.message);
    }
  };

  return (
    <div className="register-page">
      {/* 装饰性浮动元素 */}
      <div className="login-decor login-decor-1" />
      <div className="login-decor login-decor-2" />
      <div className="login-decor login-decor-3" />

      <div className="register-card">
        <div className="login-logo">
          <div className="logo-icon">
            <BankOutlined />
          </div>
          <h1>注册账号</h1>
          <p className="login-subtitle">加入企业协作平台</p>
        </div>
        <Form
          form={form}
          onFinish={handleRegister}
          size="large"
          autoComplete="off"
          scrollToFirstError
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input
              prefix={<IdcardOutlined style={{ color: '#94A3B8' }} />}
              placeholder="姓名"
              className="login-input"
            />
          </Form.Item>
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
              placeholder="用户名"
              className="login-input"
            />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#94A3B8' }} />}
              placeholder="邮箱"
              className="login-input"
            />
          </Form.Item>
          <Form.Item
            name="department"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select
              placeholder="选择部门"
              className="login-input"
              suffixIcon={<TeamOutlined style={{ color: '#94A3B8' }} />}
            >
              <Select.Option value="技术部">技术部</Select.Option>
              <Select.Option value="产品部">产品部</Select.Option>
              <Select.Option value="设计部">设计部</Select.Option>
              <Select.Option value="市场部">市场部</Select.Option>
              <Select.Option value="人事部">人事部</Select.Option>
              <Select.Option value="财务部">财务部</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="position"
            rules={[{ required: true, message: '请输入职位' }]}
          >
            <Input
              prefix={<TeamOutlined style={{ color: '#94A3B8' }} />}
              placeholder="职位"
              className="login-input"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
              placeholder="密码"
              className="login-input"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
              placeholder="确认密码"
              className="login-input"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="login-btn"
            >
              注 册
            </Button>
          </Form.Item>
          <div className="login-register-link">
            <span>已有账号？</span>
            <Link to="/">立即登录</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register;
