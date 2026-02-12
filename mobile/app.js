// 查看大图 - 支持双指缩放和拖动
function viewImage(src) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'image-viewer-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.95);
    z-index: 10000;
    overflow: hidden;
    touch-action: none;
  `;
  
  // 创建图片容器（用于缩放和拖动）
  const container = document.createElement('div');
  container.className = 'image-viewer-container';
  container.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center center;
  `;
  
  const img = document.createElement('img');
  img.src = src;
  img.className = 'image-viewer-img';
  img.style.cssText = `
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    transition: transform 0.1s ease-out;
    user-select: none;
    -webkit-user-drag: none;
  `;
  
  // 添加关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    color: white;
    font-size: 24px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    touch-action: auto;
  `;
  
  // 关闭按钮使用 touchend 事件
  let closeBtnTouchStartTime = 0;
  closeBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    closeBtnTouchStartTime = new Date().getTime();
    closeBtn.style.background = 'rgba(255,255,255,0.4)';
  }, { passive: true });
  
  closeBtn.addEventListener('touchend', (e) => {
    e.stopPropagation();
    closeBtn.style.background = 'rgba(255,255,255,0.2)';
    const touchDuration = new Date().getTime() - closeBtnTouchStartTime;
    if (touchDuration < 500) {
      document.body.removeChild(modal);
    }
  }, { passive: true });
  
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.removeChild(modal);
  });
  
  // 添加提示文字
  const hint = document.createElement('div');
  hint.style.cssText = `
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 14px;
    opacity: 0.7;
    pointer-events: none;
    background: rgba(0,0,0,0.5);
    padding: 8px 16px;
    border-radius: 20px;
  `;
  hint.textContent = '双指缩放 • 拖动查看 • 点击关闭';
  
  container.appendChild(img);
  modal.appendChild(container);
  modal.appendChild(closeBtn);
  modal.appendChild(hint);
  document.body.appendChild(modal);
  
  // 缩放和拖动状态
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let initialDistance = 0;
  let initialScale = 1;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let touchStartTime = 0;
  let hasMoved = false;
  let startTouches = null;
  
  // 更新变换
  function updateTransform() {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }
  
  // 获取双指距离
  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // 触摸开始
  function handleTouchStart(e) {
    // 如果触摸在关闭按钮上，不处理
    if (e.target === closeBtn || closeBtn.contains(e.target)) {
      return;
    }
    
    e.preventDefault();
    touchStartTime = new Date().getTime();
    hasMoved = false;
    startTouches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
    
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      initialDistance = getDistance(e.touches[0], e.touches[1]);
      initialScale = scale;
    }
  }
  
  // 触摸移动
  function handleTouchMove(e) {
    // 如果触摸在关闭按钮上，不处理
    if (e.target === closeBtn || closeBtn.contains(e.target)) {
      return;
    }
    
    e.preventDefault();
    
    // 检测移动距离
    if (startTouches && e.touches.length > 0) {
      const moveDistance = Math.sqrt(
        Math.pow(e.touches[0].clientX - startTouches[0].x, 2) +
        Math.pow(e.touches[0].clientY - startTouches[0].y, 2)
      );
      if (moveDistance > 10) {
        hasMoved = true;
      }
    }
    
    if (e.touches.length === 1 && isDragging && scale > 1) {
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      updateTransform();
    } else if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      scale = (currentDistance / initialDistance) * initialScale;
      scale = Math.min(Math.max(scale, 0.5), 4);
      updateTransform();
    }
  }
  
  // 触摸结束
  function handleTouchEnd(e) {
    // 如果触摸在关闭按钮上，不处理
    if (e.target === closeBtn || closeBtn.contains(e.target)) {
      return;
    }
    
    const touchDuration = new Date().getTime() - touchStartTime;
    const touches = e.changedTouches;
    
    // 单指轻触关闭（如果没有移动）
    if (e.touches.length === 0 && !hasMoved && touchDuration < 300) {
      // 检查触摸结束时的位置
      if (touches.length > 0) {
        const touch = touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element === modal || element === container) {
          document.body.removeChild(modal);
          return;
        }
      }
    }
    
    if (e.touches.length === 0) {
      isDragging = false;
    } else if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    }
  }
  
  // 双击重置
  let lastTapTime = 0;
  modal.addEventListener('click', (e) => {
    // 如果点击关闭按钮，不处理双击
    if (e.target === closeBtn || closeBtn.contains(e.target)) {
      return;
    }
    
    const currentTime = new Date().getTime();
    if (currentTime - lastTapTime < 300) {
      e.preventDefault();
      e.stopPropagation();
      if (scale !== 1) {
        scale = 1;
        translateX = 0;
        translateY = 0;
      } else {
        scale = 2;
      }
      updateTransform();
    }
    lastTapTime = currentTime;
  });
  
  // 绑定触摸事件到 modal
  modal.addEventListener('touchstart', handleTouchStart, { passive: false });
  modal.addEventListener('touchmove', handleTouchMove, { passive: false });
  modal.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // 鼠标滚轮缩放（桌面端支持）
  modal.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale = Math.min(Math.max(scale * delta, 0.5), 4);
    updateTransform();
  }, { passive: false });
}