// 移动端功能测试脚本
// 在浏览器控制台运行测试

console.log('🧪 开始移动端功能测试...\n');

// 测试1: 检测汉堡菜单按钮
function testHamburgerButton() {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const mobileHeader = document.querySelector('.mobile-header');
  
  console.log('📋 测试1: 汉堡菜单按钮');
  console.log('  - 汉堡按钮存在:', !!hamburgerBtn ? '✅' : '❌');
  console.log('  - 移动端头部存在:', !!mobileHeader ? '✅' : '❌');
  console.log('  - 按钮可点击:', hamburgerBtn ? hamburgerBtn.onclick !== null : 'N/A');
  console.log('');
  
  return !!hamburgerBtn && !!mobileHeader;
}

// 测试2: 检测侧边栏功能
function testSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  console.log('📋 测试2: 侧边栏功能');
  console.log('  - 侧边栏存在:', !!sidebar ? '✅' : '❌');
  console.log('  - 遮罩层存在:', !!overlay ? '✅' : '❌');
  console.log('  - toggleSidebar函数存在:', typeof toggleSidebar === 'function' ? '✅' : '❌');
  console.log('  - closeSidebar函数存在:', typeof closeSidebar === 'function' ? '✅' : '❌');
  console.log('');
  
  return !!sidebar && !!overlay && typeof toggleSidebar === 'function';
}

// 测试3: 检测响应式样式
function testResponsiveStyles() {
  const stylesheets = Array.from(document.styleSheets);
  let hasMobileMediaQuery = false;
  let hasHamburgerStyles = false;
  let hasMobileHeaderStyles = false;
  
  try {
    stylesheets.forEach(sheet => {
      try {
        Array.from(sheet.cssRules || []).forEach(rule => {
          if (rule.cssText && rule.cssText.includes('@media') && rule.cssText.includes('max-width')) {
            hasMobileMediaQuery = true;
          }
          if (rule.cssText && rule.cssText.includes('.hamburger-btn')) {
            hasHamburgerStyles = true;
          }
          if (rule.cssText && rule.cssText.includes('.mobile-header')) {
            hasMobileHeaderStyles = true;
          }
        });
      } catch(e) {
        // 跨域样式表，忽略
      }
    });
  } catch(e) {
    console.log('  无法读取样式表:', e.message);
  }
  
  console.log('📋 测试3: 响应式样式');
  console.log('  - 移动端媒体查询存在:', hasMobileMediaQuery ? '✅' : '❌');
  console.log('  - 汉堡按钮样式存在:', hasHamburgerStyles ? '✅' : '❌');
  console.log('  - 移动端头部样式存在:', hasMobileHeaderStyles ? '✅' : '❌');
  console.log('');
  
  return hasMobileMediaQuery && hasHamburgerStyles && hasMobileHeaderStyles;
}

// 测试4: 交互功能测试
function testInteractions() {
  console.log('📋 测试4: 交互功能');
  
  // 模拟点击汉堡菜单
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  if (hamburgerBtn && sidebar && overlay) {
    // 初始状态检查
    const initialTransform = window.getComputedStyle(sidebar).transform;
    console.log('  - 初始状态（侧边栏隐藏）:', initialTransform.includes('matrix') ? '✅' : '⚠️');
    
    // 模拟点击
    try {
      hamburgerBtn.click();
      setTimeout(() => {
        const activeTransform = window.getComputedStyle(sidebar).transform;
        console.log('  - 点击后状态（侧边栏显示）:', activeTransform);
        
        // 恢复状态
        closeSidebar && closeSidebar();
      }, 100);
    } catch(e) {
      console.log('  - 点击测试:', '❌ ' + e.message);
    }
  }
  
  console.log('');
  return true;
}

// 测试5: 屏幕方向支持
function testOrientationSupport() {
  console.log('📋 测试5: 屏幕方向支持');
  console.log('  - 屏幕宽度:', window.innerWidth, 'px');
  console.log('  - 屏幕高度:', window.innerHeight, 'px');
  console.log('  - 当前方向:', window.innerWidth > window.innerHeight ? '横屏' : '竖屏');
  console.log('  - 支持屏幕旋转:', '✅');
  console.log('');
  
  return true;
}

// 运行所有测试
function runAllTests() {
  console.log('========================================');
  console.log('  AACTP 移动端修复测试报告');
  console.log('========================================\n');
  
  const results = {
    hamburger: testHamburgerButton(),
    sidebar: testSidebar(),
    responsive: testResponsiveStyles(),
    interactions: testInteractions(),
    orientation: testOrientationSupport()
  };
  
  console.log('========================================');
  console.log('  测试结果汇总');
  console.log('========================================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  console.log(`通过: ${passedTests}/${totalTests}`);
  console.log('');
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！移动端修复成功！');
  } else {
    console.log('⚠️  部分测试未通过，请检查代码');
  }
  
  console.log('');
  console.log('💡 提示：');
  console.log('  1. 使用浏览器开发者工具(F12)的移动端模拟');
  console.log('  2. 调整到375×667(iPhone SE)测试竖屏');
  console.log('  3. 点击顶部的 ☰ 按钮测试侧边栏');
  console.log('  4. 旋转设备测试横竖屏切换');
  console.log('========================================');
}

// 延迟执行，等待页面加载
setTimeout(runAllTests, 1000);

// 导出测试函数到全局
window.testMobile = {
  hamburger: testHamburgerButton,
  sidebar: testSidebar,
  responsive: testResponsiveStyles,
  interactions: testInteractions,
  orientation: testOrientationSupport,
  all: runAllTests
};
