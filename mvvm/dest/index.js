(function () {
    'use strict';

    // 获取值
    const getValue = (vm, expr) => {
      const exprs = expr.split(".");
      return exprs.reduce((total, item) => {
        return total[item];
      }, vm.$data);
    }; // 添加值

    const setValue = (vm, expr, value) => {
      const exprs = expr.split(".");
      exprs.reduce((total, item, index) => {
        if (index === exprs.length - 1) {
          total[item] = value;
        } else {
          return total[item];
        }
      }, vm.$data);
    };

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    class Dep {
      constructor(key) {
        // 监听事件的列表
        this.listeners = [];
        this.uid = (Math.random() * 10000000).toFixed(0);
      } // 默认target是空的


      // 添加监听函数
      addListener(listener) {
        if (!this.listeners.includes(listener)) {
          this.listeners.push(listener);
        }
      } // 当数据变化时，通知函数


      notify() {
        //依次执行监听对象的update方法
        this.listeners.forEach(listener => listener.update());
      }

    }

    _defineProperty(Dep, "target", null);

    // watcher，观察者的目的是给需要变化的那个元素增加一个观察者，当数据变化时调用对应的方法
    class Watcher {
      constructor(vm, expr, callback) {
        this.vm = vm;
        this.expr = expr;
        this.callback = callback; // 存储旧值

        this.value = getValue(this.vm, this.expr);
      } // 对外暴露的方法


      update() {
        // 获取最新的值
        const newValue = getValue(this.vm, this.expr); // 比较新值和旧值是否相等，如果不等则执行回调函数

        if (this.value !== newValue) {
          this.callback && this.callback(newValue);
        }
      }

    }

    // compile类，作用是编译dom元素
    class Compile {
      constructor(el, vm) {
        /*
        *** 接收2个参数：
        *** element: 需要挂载的dom节点
        *** vm: mvvm实例
        */
        // 将参数挂载到compile实例上
        // 判断el是否是个dom节点，如果不是则表示是个选择器，则调用document.querySelector方法返回一个dom节点
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm; // 判断this.el是否存在，否则输入的选择器不存在

        if (this.el) {
          // 将node节点元素转换成fragment
          const fragment = this.node2fragment(this.el); // 执行编译

          this.compile(fragment); // 将fragment挂载到dom中

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
        let firstChild = null; // 将el元素的子元素逐一放到fragment中

        while (firstChild = el.firstChild) {
          fragment.appendChild(firstChild);
        }

        return fragment;
      } // 判断是否是指令


      isDirective(attrName) {
        return attrName.startsWith("v-");
      } // 编译


      compile(fragment) {
        // 获取子节点，它是一个类数组
        const childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
          // 判断node是否是文本，还是dom元素
          if (this.isElementNode(node)) {
            // console.log("这是个节点");
            this.compileElement(node); // 递归编译子节点

            this.compile(node);
          } else {
            // console.log("这是个文本");
            this.compileText(node);
          }
        });
      } // 编译文本节点


      compileText(node) {
        const textContent = node.textContent;
        const exprs = textContent.match(/\{\{(.*?)\}\}/g);

        if (exprs) {
          compileUtil.text(node, this.vm, exprs);
        }
      } // 编译元素节点


      compileElement(node) {
        // 获取所有的属性
        const attributes = node.attributes; // 依次对属性进行遍历

        Array.from(attributes).forEach(attr => {
          const attrName = attr.name;

          if (this.isDirective(attrName)) {
            const expr = attr.value;
            const [, type] = attrName.split("v-");
            compileUtil[type](node, this.vm, expr);
          }
        });
      }

    }
    const compileUtil = {
      text(node, vm, exprs) {
        // 这里exprs是一个数组
        const value = node.textContent; // 判断是否添加过watcher

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
        const updateFunc = this.modelUpdater; // 添加监听器

        const watcher = new Watcher(vm, expr, () => {
          console.log("数据更新了");
          updateFunc && updateFunc(node, getValue(vm, expr));
        });
        Dep.target = watcher;
        updateFunc && updateFunc(node, getValue(vm, expr));
        Dep.target = null; // 添加监听事件

        node.addEventListener("input", event => {
          setValue(vm, expr, event.target.value);
        });
      },

      modelUpdater(node, value) {
        node.value = value;
      },

      textUpdater(node, value) {
        node.textContent = value;
      }

    };

    // 数据劫持或数据响应式
    class Observer {
      constructor(data) {
        this.observe(data);
      }

      observe(data) {
        // 如果data为空，或者不是个对象，则直接返回
        if (!data || typeof data !== "object") {
          return;
        }

        Object.keys(data).forEach(key => {
          this.observe(data[key]);
          this.defineReactive(data, key, data[key]);
        });
      }

      defineReactive(data, key, value) {
        const that = this;
        const dep = new Dep(key);
        Object.defineProperty(data, key, {
          enumerable: true,
          configurable: true,

          get() {
            Dep.target && dep.addListener(Dep.target);
            return value;
          },

          set(newValue) {
            if (newValue != value) {
              that.observe(newValue);
              value = newValue;
              dep.notify(); // 通知更新
            }
          }

        });
      }

    }

    // 创建MVVM类
    class MVVM {
      constructor(options) {
        // 解析参数，将参数挂载到实例上
        this.$options = options;
        this.$el = options.el;
        this.$data = options.data; // 数据劫持/数据响应式

        new Observer(this.$data); // 将数据代理到实例上

        this.proxyData(this.$data); // 判断el是否存在，如果存在则执行编译工作

        if (this.$el) {
          new Compile(this.$el, this);
        }
      } // 将数据代理到this上


      proxyData(data) {
        Object.keys(data).forEach(key => {
          Object.defineProperty(this, key, {
            enumerable: true,
            configurable: true,

            get() {
              return this.$data[key];
            },

            set(newValue) {
              this.$data[key] = newValue;
            }

          });
        });
      }

    }
    window.MVVM = MVVM;

    return MVVM;

}());
//# sourceMappingURL=index.js.map
