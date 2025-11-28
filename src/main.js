/**
 * 页面水印组件
 * 提供明水印和暗水印双重保护，防止用户移除
 */

const watermark = (function () {
    'use strict';

    // 使用随机生成的 ID，增加隐蔽性
    const generateId = (prefix) => {
        const random = Math.random().toString(36).substring(2, 9);
        return `${prefix}_${random}_${Date.now().toString(36)}`;
    };

    let maskId = null;
    let invisibleId = null;
    let watermark = {};
    let maskObserver = null;
    let invisibleObserver = null;
    let maskCheckInterval = null;
    let invisibleCheckInterval = null;
    let currentConfig = null;
    let canvasCache = new Map(); // 缓存 canvas 数据，避免重复创建

    // 防抖函数，避免频繁重建
    const debounce = (func, wait = 100) => {
        let timeout = null;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // 安全移除节点
    const removeNode = (id) => {
        try {
            const elem = document.getElementById(id);
            if (elem && elem.parentNode) {
                elem.parentNode.removeChild(elem);
            }
        } catch (e) {
            console.warn('Watermark: Failed to remove node', e);
        }
    };

    // DJB2 hash 算法（优化版）
    const hashCode = (str) => {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) + hash + str.charCodeAt(i);
        }
        return hash >>> 0;
    };

    const hashShort = (str) => {
        return hashCode(str).toString(16);
    };

    // 生成 canvas 水印图片
    const createWatermarkCanvas = (config) => {
        const cacheKey = JSON.stringify(config);
        if (canvasCache.has(cacheKey)) {
            return canvasCache.get(cacheKey);
        }

        try {
            const stage = document.createElement('canvas');
            stage.width = config.width;
            stage.height = config.height;

            const ctx = stage.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas context not available');
            }

            ctx.translate(stage.width / 2, stage.height / 2);
            ctx.rotate((config.angle * Math.PI) / 180);
            ctx.font = `${config.fontSize} Arial`;
            ctx.fillStyle = config.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.str1, 0, -stage.height / 10);
            if (config.str2) {
                ctx.fillText(config.str2, 0, stage.height / 10);
            }

            const dataURL = stage.toDataURL('image/png');
            canvasCache.set(cacheKey, dataURL);
            return dataURL;
        } catch (e) {
            console.error('Watermark: Failed to create canvas', e);
            return '';
        }
    };

    // 创建水印 DOM 元素
    const createWatermarkElement = (id, config, dataURL) => {
        const div = document.createElement('div');
        div.id = id;

        // 设置不可变样式属性
        const style = {
            pointerEvents: 'none',
            top: '0px',
            left: '0px',
            position: 'fixed',
            zIndex: config.zIndex,
            width: '100%',
            height: '100%',
            opacity: config.opacity || 0.5,
            background: `url(${dataURL})`,
            backgroundRepeat: 'repeat',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
        };

        Object.assign(div.style, style);

        // 使用 Object.defineProperty 保护关键样式属性
        try {
            Object.defineProperty(div.style, 'display', {
                get: () => 'block',
                set: () => {},
                configurable: false
            });
            Object.defineProperty(div.style, 'visibility', {
                get: () => 'visible',
                set: () => {},
                configurable: false
            });
            Object.defineProperty(div.style, 'opacity', {
                get: () => style.opacity,
                set: () => {},
                configurable: false
            });
        } catch (e) {
            // 某些浏览器可能不支持，忽略错误
        }

        return div;
    };

    // 设置水印
    const setWatermark = ({title = '', subtitle = '', width = 240, height = 180, angle = -20, fontSize = '22px', alpha = 0.2, invisible = false}) => {
        const realId = invisible ? invisibleId : maskId;
        if (!realId) {
            return null;
        }

        removeNode(realId);

        const config = invisible
            ? {
                  str1: hashShort(title),
                  str2: hashShort(subtitle),
                  width: 120,
                  height: 120,
                  angle: 30,
                  fontSize: '22px',
                  color: 'rgba(128, 128, 128, 0.016)',
                  zIndex: 10001,
                  opacity: 1
              }
            : {
                  str1: title + ' 哉',
                  str2: '',
                  width,
                  height,
                  angle,
                  fontSize,
                  color: `rgba(128, 128, 128, ${alpha})`,
                  zIndex: 10000,
                  opacity: 0.5
              };

        const dataURL = createWatermarkCanvas(config);
        if (!dataURL) {
            return null;
        }

        const div = createWatermarkElement(realId, config, dataURL);

        try {
            document.body.appendChild(div);
            return div;
        } catch (e) {
            console.error('Watermark: Failed to append element', e);
            return null;
        }
    };

    // 检查水印元素是否被篡改
    const checkWatermarkIntegrity = (id, config, isInvisible) => {
        const elem = document.getElementById(id);

        if (!elem) {
            // 元素被删除，重新创建
            return false;
        }

        // 检查是否还在 body 下
        if (elem.parentNode !== document.body) {
            try {
                document.body.appendChild(elem);
            } catch (e) {
                return false;
            }
        }

        // 检查关键样式是否被修改
        const computedStyle = window.getComputedStyle(elem);
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || parseFloat(computedStyle.opacity) < 0.01) {
            // 样式被隐藏，恢复
            elem.style.display = 'block';
            elem.style.visibility = 'visible';
            elem.style.opacity = config.opacity || (isInvisible ? 1 : 0.5);
            return false;
        }

        // 检查 z-index 是否被修改
        const expectedZIndex = isInvisible ? 10001 : 10000;
        if (parseInt(computedStyle.zIndex) !== expectedZIndex) {
            elem.style.zIndex = expectedZIndex;
        }

        return true;
    };

    // 监听节点变化
    const watchNode = (elem, targetId, config, isInvisible) => {
        if (!elem || !elem.parentNode) {
            return {observer: null, watch: () => {}, checkInterval: null};
        }

        const debouncedCallback = debounce(() => {
            const isValid = checkWatermarkIntegrity(targetId, config, isInvisible);
            if (!isValid) {
                const newElem = setWatermark({...config, invisible: isInvisible});
                if (newElem && newElem !== elem) {
                    // 重新监听新元素
                    observer.disconnect();
                    clearInterval(checkInterval);
                    const newWatch = watchNode(newElem, targetId, config, isInvisible);
                    if (isInvisible) {
                        invisibleObserver = newWatch;
                        invisibleCheckInterval = newWatch.checkInterval;
                    } else {
                        maskObserver = newWatch;
                        maskCheckInterval = newWatch.checkInterval;
                    }
                }
            }
        }, 50);

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 检查是否有节点被移除
                    if (mutation.removedNodes) {
                        for (const node of mutation.removedNodes) {
                            if (node.id === targetId || (node.nodeType === 1 && node.querySelector && node.querySelector(`#${targetId}`))) {
                                debouncedCallback();
                                break;
                            }
                        }
                    }
                } else if (mutation.type === 'attributes') {
                    // 检查属性变化
                    const target = document.getElementById(targetId);
                    if (target && (mutation.attributeName === 'style' || mutation.attributeName === 'id' || mutation.attributeName === 'class')) {
                        debouncedCallback();
                    }
                }
            }
        });

        // 监听父节点和自身
        observer.observe(elem.parentNode, {
            childList: true,
            subtree: false
        });

        observer.observe(elem, {
            attributes: true,
            attributeFilter: ['style', 'id', 'class'],
            attributeOldValue: true
        });

        // 定期检查完整性
        const checkInterval = setInterval(() => {
            const isValid = checkWatermarkIntegrity(targetId, config, isInvisible);
            if (!isValid) {
                const newElem = setWatermark({...config, invisible: isInvisible});
                if (newElem && newElem !== elem) {
                    // 重新监听新元素
                    observer.disconnect();
                    clearInterval(checkInterval);
                    const newWatch = watchNode(newElem, targetId, config, isInvisible);
                    if (isInvisible) {
                        invisibleObserver = newWatch;
                        invisibleCheckInterval = newWatch.checkInterval;
                    } else {
                        maskObserver = newWatch;
                        maskCheckInterval = newWatch.checkInterval;
                    }
                }
            }
        }, 1500);

        return {
            observer,
            watch: (node) => {
                observer.observe(node, {
                    attributes: true,
                    attributeFilter: ['style', 'id', 'class'],
                    attributeOldValue: true
                });
            },
            checkInterval
        };
    };

    // 清理所有监听和定时器
    const cleanup = () => {
        if (maskObserver && maskObserver.observer) {
            maskObserver.observer.disconnect();
        }
        if (invisibleObserver && invisibleObserver.observer) {
            invisibleObserver.observer.disconnect();
        }
        if (maskCheckInterval) {
            clearInterval(maskCheckInterval);
            maskCheckInterval = null;
        }
        if (invisibleCheckInterval) {
            clearInterval(invisibleCheckInterval);
            invisibleCheckInterval = null;
        }
    };

    // 设置水印
    watermark.set = (config) => {
        try {
            // 清理旧的
            watermark.remove();

            // 生成新的 ID
            maskId = generateId('wm');
            invisibleId = generateId('_wm');

            // 保存配置
            currentConfig = {...config};

            // 创建明水印
            const maskTarget = setWatermark(config);
            if (!maskTarget) {
                throw new Error('Failed to create visible watermark');
            }

            // 创建暗水印
            const invisibleConfig = {...config, invisible: true};
            const invisibleTarget = setWatermark(invisibleConfig);
            if (!invisibleTarget) {
                throw new Error('Failed to create invisible watermark');
            }

            // 监听明水印
            maskObserver = watchNode(maskTarget, maskId, config, false);
            maskCheckInterval = maskObserver.checkInterval;

            // 监听暗水印
            invisibleObserver = watchNode(invisibleTarget, invisibleId, invisibleConfig, true);
            invisibleCheckInterval = invisibleObserver.checkInterval;

            // 监听页面可见性变化，确保水印始终存在
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    setTimeout(() => {
                        checkWatermarkIntegrity(maskId, config, false);
                        checkWatermarkIntegrity(invisibleId, invisibleConfig, true);
                    }, 100);
                }
            });
        } catch (e) {
            console.error('Watermark: Failed to set watermark', e);
            cleanup();
        }
    };

    // 移除水印
    watermark.remove = () => {
        cleanup();
        if (maskId) {
            removeNode(maskId);
            maskId = null;
        }
        if (invisibleId) {
            removeNode(invisibleId);
            invisibleId = null;
        }
        currentConfig = null;
        canvasCache.clear();
    };

    // 获取当前配置
    watermark.getConfig = () => {
        return currentConfig ? {...currentConfig} : null;
    };

    // 导出 - 支持多种模块系统
    if (typeof module !== 'undefined' && module.exports) {
        // CommonJS 模块
        module.exports = watermark;
    }
    if (typeof define === 'function' && define.amd) {
        // AMD 模块
        define([], () => watermark);
    }
    if (typeof window !== 'undefined') {
        // 全局变量
        window.watermark = watermark;
    }

    // 返回 watermark 对象，用于 ES6 模块导出
    return watermark;
})();

// ES6 模块导出
export default watermark;
