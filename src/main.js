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
    let hash = 5381,
        index = str.length;
    while (index) {
        hash = (hash * 33) ^ str.charCodeAt(--index);
    }
    return hash >>> 0;
};
const hashShort = (str) => {
    return hashCode(str).toString(16);
};

const setWatermark = ({
    title = '',
    subtitle = '',
    width = 240,
    height = 180,
    angle = -20,
    fontSize = '22px',
    alpha = 0.08,
    invisible = false
}) => {
    let realId = invisible ? invisibleId : maskId;
    removeNode(realId);

    let str1 = title;
    let str2 = '';
    let color = `rgba(128, 128, 128, ${alpha})`;
    let zIndex = 10000;
    if (invisible) {
        str1 = hashShort(title);
        str2 = hashShort(subtitle);
        width = 120;
        height = 120;
        angle = 30;
        fontSize = '22px';
        color = 'rgba(128, 128, 128, 0.008)';
        zIndex = 10001;
    }

    let stage = document.createElement('canvas');
    stage.width = width;
    stage.height = height;

    let ctx = stage.getContext('2d');
    ctx.translate(stage.width / 2, stage.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.font = `${fontSize} Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str1, 0, -stage.height / 10);
    ctx.fillText(str2, 0, stage.height / 10);

    let div = document.createElement('div');
    div.id = realId;
    div.style.pointerEvents = 'none';
    div.style.top = '0px';
    div.style.left = '0px';
    div.style.position = 'fixed';
    div.style.zIndex = zIndex;
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.background = 'url(' + stage.toDataURL('image/png') + ')';
    document.body.appendChild(div);
    return div;
};

const watchNode = (elem, targetId, callback) => {
    let parent = elem.parentNode;
    if (!parent) {
        return;
    }
    let config1 = {
        childList: true
    };
    let config2 = {
        attributes: true,
        attributeOldValue: true
    };
    let observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            switch (mutation.type) {
                case 'childList':
                    for (const node of mutation.removedNodes) {
                        if (node.id === targetId) {
                            callback();
                        }
                    }
                    break;
                case 'attributes':
                    if (mutation.attributeName === 'id' || mutation.attributeName === 'style') {
                        removeNode(mutation.target.id);
                        callback();
                    }
                    break;
                default:
                    break;
            }
        }
    });
    observer.observe(parent, config1);
    let watchSelf = (node) => {
        observer.observe(node, config2);
    };
    watchSelf(elem);

    return {
        observer: observer,
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
        }
    });
    invisibleObserver = watchNode(invisibleTarget, invisibleId, () => {
        let target = document.getElementById(invisibleId);
        if (!target) {
            target = setWatermark(invisibleConfig);
            invisibleObserver.watch(target);
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
