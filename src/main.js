let maskId = 'wm3.1415926';
let invisibleId = '_wm3.1415926';
let watermark = {};
let maskObserver = null;
let invisibleObserver = null;

const removeNode = (id) => {
    let elem = document.getElementById(id);
    if (elem != null) {
        elem.parentNode.removeChild(elem);
    }
};
// Times33 hash
const hashCode = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) + hash + str.charCodeAt(i); // hash * 33 + char
    }
    return hash >>> 0;
};
const hashShort = (str) => {
    return hashCode(str).toString(16);
};

const setWatermark = ({title = '', subtitle = '', width = 240, height = 180, angle = -20, fontSize = '22px', alpha = 0.2, invisible = false}) => {
    let realId = invisible ? invisibleId : maskId;
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
              zIndex: 10001
          }
        : {
              str1: title + ' 哉',
              str2: '',
              width,
              height,
              angle,
              fontSize,
              color: `rgba(128, 128, 128, ${alpha})`,
              zIndex: 10000
          };

    const stage = document.createElement('canvas');
    stage.width = config.width;
    stage.height = config.height;

    const ctx = stage.getContext('2d');
    ctx.translate(stage.width / 2, stage.height / 2);
    ctx.rotate((config.angle * Math.PI) / 180);
    ctx.font = `${config.fontSize} Arial`;
    ctx.fillStyle = config.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.str1, 0, -stage.height / 10);
    config.str2 && ctx.fillText(config.str2, 0, stage.height / 10);

    const div = document.createElement('div');
    div.id = realId;
    Object.assign(div.style, {
        pointerEvents: 'none',
        top: '0px',
        left: '0px',
        position: 'fixed',
        zIndex: config.zIndex,
        width: '100%',
        height: '100%',
        opacity: 0.5,
        background: `url(${stage.toDataURL('image/png')})`
    });

    document.body.appendChild(div);
    return div;
};

const watchNode = (elem, targetId, callback) => {
    let parent = elem.parentNode;
    if (!parent) {
        return {observer: null, watch: () => {}};
    }
    let observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.target === document.body) {
                for (const node of mutation.removedNodes) {
                    if (node.id === targetId) {
                        callback();
                        break;
                    }
                }
            } else if (mutation.type === 'attributes') {
                removeNode(mutation.target.id);
                callback();
            }
        }
    });
    observer.observe(parent, {childList: true});
    const watchSelf = (node) => {
        observer.observe(node, {attributes: true, attributeOldValue: true});
    };
    watchSelf(elem);

    return {
        observer,
        watch: watchSelf
    };
};

watermark.set = (config) => {
    let maskTarget = setWatermark(config);
    let invisibleConfig = {...config, invisible: true};
    let invisibleTarget = setWatermark(invisibleConfig);
    maskObserver = watchNode(maskTarget, maskId, () => {
        let target = document.getElementById(maskId);
        if (!target) {
            target = setWatermark(config);
            maskObserver.watch(target);
        } else if (target.parentNode !== document.body) {
            document.body.appendChild(target);
        }
    });
    invisibleObserver = watchNode(invisibleTarget, invisibleId, () => {
        let target = document.getElementById(invisibleId);
        if (!target) {
            target = setWatermark(invisibleConfig);
            invisibleObserver.watch(target);
        } else if (target.parentNode !== document.body) {
            document.body.appendChild(target);
        }
    });
};

watermark.remove = () => {
    removeNode(maskId);
    removeNode(invisibleId);
    maskObserver.observer && maskObserver.observer.disconnect();
    invisibleObserver.observer && invisibleObserver.observer.disconnect();
};

export default watermark;
