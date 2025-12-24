// Format: __PLACEHOLDER_{ENV_NAME}__ will be replaced with actual env value
(function() {
  const config = {
    API_BASE_URL: "__PLACEHOLDER_API_BASE_URL__",
  };
  
  Object.defineProperty(window, '__RUNTIME_CONFIG__', {
    value: Object.freeze(config),
    writable: false,        // 不可写
    configurable: false,    // 不可删除/重配置
    enumerable: true        // 可枚举
  });
})();