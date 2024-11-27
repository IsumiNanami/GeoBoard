// 获取 HTML 元素
const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');

// 设置实际绘制区域大小，确保与 CSS 样式匹配
canvas.width = 800; // 设置画布的实际宽度
canvas.height = 600; // 设置画布的实际高度

const drawPointBtn = document.getElementById('draw-point-btn');
const drawLineBtn = document.getElementById('draw-line-btn');

// 定义绘制模式和状态变量
let mode = null;
let startPoint = null; // 记录线段的起点
let isDrawingLine = false; // 表示是否正在绘制线段
const actions = []; // 用于存储绘制记录
const gravityThreshold = 10; // 定义引力范围
const lineAttractionThreshold = 5; // 线段引力范围

// 点击按钮设置模式
drawPointBtn.addEventListener('click', () => {
    mode = 'point';
    isDrawingLine = false;
    redrawCanvas(); // 确保画布清理时不显示动态线段
});
drawLineBtn.addEventListener('click', () => {
    mode = 'line';
    isDrawingLine = false;
    startPoint = null;
});

// 绘制点函数
function drawPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
}

// 绘制线段函数
function drawLine(start, end, color = 'blue') {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.stroke();
}

// 计算鼠标位置是否被吸引到点
function applyGravity(x, y) {
    for (const action of actions) {
        if (action.type === 'point') {
            const dx = action.x - x;
            const dy = action.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < gravityThreshold) {
                return { x: action.x, y: action.y }; // 返回吸引到的点
            }
        }
    }
    return { x, y }; // 如果没有吸引，返回原位置
}

// 计算鼠标到线段的最短距离
function distanceToLineSegment(px, py, ax, ay, bx, by) {
    const lineLength = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
    if (lineLength === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2); // 点到点的距离

    const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lineLength ** 2));
    const projectionX = ax + t * (bx - ax);
    const projectionY = ay + t * (by - ay);

    const dx = px - projectionX;
    const dy = py - projectionY;

    return Math.sqrt(dx * dx + dy * dy); // 返回垂直距离
}

// 计算鼠标位置是否靠近线段
function applyLineAttraction(x, y) {
    if (startPoint) {
        for (const action of actions) {
            if (action.type === 'line') {
                const distance = distanceToLineSegment(x, y, action.start.x, action.start.y, action.end.x, action.end.y);
                if (distance < lineAttractionThreshold) {
                    // 如果鼠标距离某条线段小于阈值，吸引鼠标到最近的线段位置
                    const t = Math.max(0, Math.min(1, ((x - action.start.x) * (action.end.x - action.start.x) + (y - action.start.y) * (action.end.y - action.start.y)) /
                        ((action.end.x - action.start.x) ** 2 + (action.end.y - action.start.y) ** 2)));
                    const attractedX = action.start.x + t * (action.end.x - action.start.x);
                    const attractedY = action.start.y + t * (action.end.y - action.start.y);
                    return { x: attractedX, y: attractedY }; // 返回吸引到线段的点
                }
            }
        }
    }
    return { x, y }; // 如果没有吸引，返回原位置
}

// 画布点击事件
canvas.addEventListener('click', (e) => {
    let x = e.clientX - canvas.offsetLeft;
    let y = e.clientY - canvas.offsetTop;

    // 应用引力
    ({ x, y } = applyGravity(x, y));

    // 在绘制线段时，检查是否靠近线段并调整鼠标点击位置
    if (mode === 'line') {
        ({ x, y } = applyLineAttraction(x, y)); // 吸引到线段上
    }

    if (mode === 'point') {
        // 绘制点
        drawPoint(x, y);
        actions.push({ type: 'point', x, y });
    } else if (mode === 'line') {
        if (!startPoint) {
            // 第一次点击：设置起点
            startPoint = { x, y };
            drawPoint(x, y);
            actions.push({ type: 'point', x, y });
            isDrawingLine = true; // 开始动态线段
        } else {
            // 第二次点击：确定终点并绘制线段
            const endPoint = { x, y };
            drawLine(startPoint, endPoint);
            drawPoint(x, y);
            actions.push({ type: 'line', start: startPoint, end: endPoint });
            actions.push({ type: 'point', x, y });
            startPoint = null; // 重置起点
            isDrawingLine = false; // 停止动态线段
        }
    }
});

// 动态线段功能
canvas.addEventListener('mousemove', (e) => {
    if (mode === 'line' && isDrawingLine && startPoint) {
        let x = e.clientX - canvas.offsetLeft;
        let y = e.clientY - canvas.offsetTop;

        // 应用引力：点和线段
        ({ x, y } = applyGravity(x, y));
        ({ x, y } = applyLineAttraction(x, y));

        // 重绘画布，并在鼠标位置绘制动态线段
        redrawCanvas();
        drawLine(startPoint, { x, y }, 'gray'); // 动态线段颜色为灰色
    }
});

// 重绘画布函数
function redrawCanvas() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 重新绘制所有操作
    actions.forEach((action) => {
        if (action.type === 'point') {
            drawPoint(action.x, action.y);
        } else if (action.type === 'line') {
            drawLine(action.start, action.end);
        }
    });
}
