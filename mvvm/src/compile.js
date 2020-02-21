// compile类，作用是编译dom元素
import { getValue, setValue } from "./utils";
import Dep from "./dep";
import Watcher from "./watcher";

export default class Compile {
    constructor(el, vm) {
            /*
             *** 接收2个参数：
             *** element: 需要挂载的dom节点
             *** vm: mvvm实例
             */
            // 将参数挂载到compile实例上
            // 判断el是否是个dom节点，如果不是则表示是个选择器，则调用document.querySelector方法返回一个dom节点
            this.el = this.isElementNode(el) ? el : document.querySelector(el);
            this.vm = vm;

            // 判断this.el是否存在，否则输入的选择器不存在
            if (this.el) {
                // 将node节点元素转换成fragment
                const fragment = this.node2fragment(this.el);

                // 执行编译
                this.compile(fragment);

                // 将fragment挂载到dom中
                this.el.appendChild(fragment);
            }
        }
        /*---------工具方法----------*/
        // 判断是否是dom节点
    isElementNode(node) {
            return node.nodeType === 1;
        }
        /*---------编译核心方法-------*/
        // 将node转换成fragment
    node2fragment(el) {
            // 创建一个文档碎片fragment，内存中的dom节点，以提高执行效率
            const fragment = document.createDocumentFragment();
            let firstChild = null;
            // 将el元素的子元素逐一放到fragment中
            while (firstChild = el.firstChild) {
                fragment.appendChild(firstChild);
            }
            return fragment;
        }
        // 判断是否是指令
    isDirective(attrName) {
            return attrName.startsWith("v-");
        }
        // 编译
    compile(fragment) {
            // 获取子节点，它是一个类数组
            const childNodes = fragment.childNodes;
            Array.from(childNodes).forEach(node => {
                // 判断node是否是文本，还是dom元素
                if (this.isElementNode(node)) {
                    // console.log("这是个节点");
                    this.compileElement(node);
                    // 递归编译子节点
                    this.compile(node);
                } else {
                    // console.log("这是个文本");
                    this.compileText(node);
                }
            })
        }
        // 编译文本节点
    compileText(node) {
            const textContent = node.textContent;
            const exprs = textContent.match(/\{\{(.*?)\}\}/g);
            if (exprs) {
                compileUtil.text(node, this.vm, exprs);
            }
        }
        // 编译元素节点
    compileElement(node) {
        // 获取所有的属性
        const attributes = node.attributes;
        // 依次对属性进行遍历
        Array.from(attributes).forEach(attr => {
            const attrName = attr.name;
            if (this.isDirective(attrName)) {
                const expr = attr.value;
                const [, type] = attrName.split("v-");

                compileUtil[type](node, this.vm, expr);
            }
        });
    }
};


const compileUtil = {
    text(node, vm, exprs) {
        // 这里exprs是一个数组
        const value = node.textContent;
        // 判断是否添加过watcher
        let isWatcher = false;
        const updateFunc = this.textUpdater;

        function getVal() {
            let _value = value;
            exprs.forEach(item => {
                item.match(/\{\{(.*?)\}\}/g);
                const expr = RegExp.$1;
                if (!isWatcher) {
                    // 添加watcher
                    const watcher = new Watcher(vm, expr, () => {
                        updateFunc && updateFunc(node, getVal());
                    });
                    Dep.target = watcher;
                }
                _value = _value.replace(item, getValue(vm, expr));
                Dep.target = null;
            });
            return _value;
        }
        updateFunc && updateFunc(node, getVal());
        isWatcher = true;
    },
    model(node, vm, expr) {
        const updateFunc = this.modelUpdater;
        // 添加监听器
        const watcher = new Watcher(vm, expr, () => {
            console.log("数据更新了");
            updateFunc && updateFunc(node, getValue(vm, expr));
        })
        Dep.target = watcher;
        updateFunc && updateFunc(node, getValue(vm, expr));
        Dep.target = null;

        // 添加监听事件
        node.addEventListener("input", (event) => {
            setValue(vm, expr, event.target.value)
        })
    },
    modelUpdater(node, value) {
        node.value = value;
    },
    textUpdater(node, value) {
        node.textContent = value;
    }
}