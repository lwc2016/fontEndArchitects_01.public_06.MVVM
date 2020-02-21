#### 一，MVVM原理介绍
MVVM指的是数据模型发生变化后，会引起视图改变。视图改变后，会导致数据模型发生变化。

MVVM的核心原理有几部分组成：
- observer: 
- compile: 
- watcher: 
- dep: 

##### 1. observer实现过程
需要响应的数据必须是一个对象或者是一个函数，如果是函数的话，它的返回值必须是一个对象。通过Object.keys方法依次拿到数据的key，然后使用Object.defineProperty方法来修改数据的key键对应的配置。自定义get和set方法，在get方法中，添加依赖对象。然后在set方法监听数据变化，依赖对象通知改变。

##### 2. compile实现过程
通过document.createDocumentFragment，创建一个fragment。依次遍历递归dom节点，将起子元素全部通过fragment的方式存储到内存中，以提供性能。依次判断每个子节点，如果是文本节点，则判断是否有插值表达式。如果有则会添加一个watcher，然后在获取数据时将water添加到依赖中。如果是元素节点，则依次遍历属性，判断是否有插值指令。如果有则新创建一个watcher，再将water添加到dep依赖对象中。当数据变化时，依赖对象会通知watcher调用update方法，以实现更新页面的效果。

#### 二，手动实现MVVM框架
1. mvvm入口文件
```javascript
// 创建MVVM类
import Compile from "./compile";
import Observer from "./observer";

export default class MVVM{
    constructor(options){
        // 解析参数，将参数挂载到实例上
        this.$options = options;
        this.$el = options.el;
        this.$data = options.data;
        
        // 数据劫持/数据响应式
        new Observer(this.$data);
        // 将数据代理到实例上
        this.proxyData(this.$data);
        // 判断el是否存在，如果存在则执行编译工作
        if(this.$el){
            new Compile(this.$el, this);
        }
    }
    // 将数据代理到this上
    proxyData(data){
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                enumerable: true,
                configurable: true,
                get(){
                    return this.$data[key];
                },
                set(newValue){
                    this.$data[key] = newValue;
                }
            })
        });
    }
}

```
2. compile编译器
```javascript
// compile类，作用是编译dom元素
// compile类，作用是编译dom元素
import { getValue, setValue } from "./utils";
import Dep from "./dep";
import Watcher from "./watcher";

export default class Compile{
    constructor(el, vm){
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
        if(this.el){
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
    isElementNode(node){
        return node.nodeType === 1;
    }
    /*---------编译核心方法-------*/
    // 将node转换成fragment
    node2fragment(el){
        // 创建一个文档碎片fragment，内存中的dom节点，以提高执行效率
        const fragment = document.createDocumentFragment();
        let firstChild = null;
        // 将el元素的子元素逐一放到fragment中
        while(firstChild = el.firstChild){
            fragment.appendChild(firstChild);
        }
        return fragment;
    }
    // 判断是否是指令
    isDirective(attrName){
        return attrName.startsWith("v-");
    }
    // 编译
    compile(fragment){
        // 获取子节点，它是一个类数组
        const childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
            // 判断node是否是文本，还是dom元素
            if(this.isElementNode(node)){
                // console.log("这是个节点");
                this.compileElement(node);
                // 递归编译子节点
                this.compile(node);
            }else{
                // console.log("这是个文本");
                this.compileText(node);
            }
        })
    }
    // 编译文本节点
    compileText(node){
        const textContent = node.textContent;
        const exprs = textContent.match(/\{\{(.*?)\}\}/g);
        if(exprs){
            compileUtil.text(node, this.vm, exprs);
        }
    }
    // 编译元素节点
    compileElement(node){
        // 获取所有的属性
        const attributes = node.attributes;
        // 依次对属性进行遍历
        Array.from(attributes).forEach(attr => {
            const attrName = attr.name;
            if(this.isDirective(attrName)){
                const expr = attr.value;
                const [, type] = attrName.split("v-");

                compileUtil[type](node, this.vm, expr);
            }
        });
    }
};


const compileUtil = {
    text(node, vm, exprs){
        // 这里exprs是一个数组
        const value = node.textContent;
        // 判断是否添加过watcher
        let isWatcher = false;
        const updateFunc = this.textUpdater;

        function getVal(){
            let _value = value;
            exprs.forEach(item => {
                item.match(/\{\{(.*?)\}\}/g);
                const expr = RegExp.$1;
                if(!isWatcher){
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
    model(node, vm, expr){
        const updateFunc = this.modelUpdater;
        // 添加监听器
        const watcher = new Watcher(vm, expr, ()=>{
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
    modelUpdater(node, value){
        node.value = value;
    },
    textUpdater(node, value){
        node.textContent = value;
    }
}
```
3. observer数据劫持/响应数据
```javascript
// 数据劫持或数据响应式
import Dep from "./dep";

export default class Observer{
    constructor(data){
        this.observe(data);
    }
    observe(data){
        // 如果data为空，或者不是个对象，则直接返回
        if(!data || typeof data !== "object"){
            return;
        }
        Object.keys(data).forEach(key => {
            this.observe(data[key]);
            this.defineReactive(data, key, data[key]);
        });
    }
    defineReactive(data, key, value){
        const that = this;
        const dep = new Dep(key);
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get(){
                Dep.target && dep.addListener(Dep.target);
                return value;
            },
            set(newValue){
                if(newValue != value){
                    that.observe(newValue);
                    value = newValue;
                    dep.notify();  // 通知更新
                }
            }
        })
    }
}
```
4.watcher监听者
```javascript
// watcher，观察者的目的是给需要变化的那个元素增加一个观察者，当数据变化时调用对应的方法
import { getValue } from "./utils";

export default class Watcher{
    constructor(vm, expr, callback){
        this.vm = vm;
        this.expr = expr;
        this.callback = callback;
        // 存储旧值
        this.value = getValue(this.vm, this.expr);
    }
    // 对外暴露的方法
    update(){
        // 获取最新的值
        const newValue = getValue(this.vm, this.expr);
        // 比较新值和旧值是否相等，如果不等则执行回调函数
        if(this.value !== newValue){
            this.callback && this.callback(newValue);
        }
    }
};
```
5. dep依赖收集
```javascript
export default class Dep{
    constructor(key){
        // 监听事件的列表
        this.listeners = [];
        this.uid = (Math.random() * 10000000).toFixed(0);
    }
    // 默认target是空的
    static target = null;
    // 添加监听函数
    addListener(listener){
        if(!this.listeners.includes(listener)){
            this.listeners.push(listener);
        }
    }
    // 当数据变化时，通知函数
    notify(){
        //依次执行监听对象的update方法
        this.listeners.forEach(listener => listener.update());
    }
}
```
6. 工具函数
```javascript
// 获取值
export const getValue = (vm, expr) => {
    const exprs = expr.split(".");
    return exprs.reduce((total, item) => {
        return total[item];
    }, vm.$data);
};

// 添加值
export const setValue = (vm, expr, value) => {
    const exprs = expr.split(".");
    exprs.reduce((total, item, index) => {
        if(index === exprs.length - 1){
            total[item] = value;
        }else{
            return total[item];
        }
    }, vm.$data);
};
```