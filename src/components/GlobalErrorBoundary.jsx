import React from 'react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Логирование ошибки в консоль с красным цветом
    console.error('%cError in component tree:', 'color: red;', error);
    // Не меняем состояние, чтобы попытаться отрендерить дочерние компоненты как обычно
    return { hasError: false };
  }

  componentDidCatch(error, errorInfo) {
    // Дополнительное логирование ошибки
    console.error('%cComponent error details:', 'color: red;', errorInfo);
  }

  render() {
    // Здесь возвращаем детей, даже если ошибка произошла
    return this.props.children;
  }
}

export default GlobalErrorBoundary;
