//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
//     ����ע�� by hanzichi @https://github.com/hanzichi
//     �ҵ�Դ����˳�򣨸�ϵ�н���������Ӧ��
//     Object -> Array -> Collection -> Function -> Utility

(function() {

    // Baseline setup
    // �������á�����
    // --------------

    // Establish the root object, `window` in the browser, or `exports` on the server.
    // �� this ��ֵ���ֲ����� root
    // root ��ֵ, �ͻ���Ϊ `window`, �����(node) ��Ϊ `exports`
    var root = this;

    // Save the previous value of the `_` variable.
    // ��ԭ��ȫ�ֻ����еı��� `_` ��ֵ������ previousUnderscore ���л���
    // �ں���� noConflict ���������õ�
    var previousUnderscore = root._;

    // Save bytes in the minified (but not gzipped) version:
    // �������, ����ѹ������
    // �� `ѹ��` Ϊѹ���� min.js �汾
    // ������ gzip ѹ��
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    // Create quick reference variables for speed access to core prototypes.
    // �������, ����ѹ������
    // ͬʱ�ɼ�����ԭ�����еĲ��Ҵ���(��ߴ���Ч��)
    var
        push             = ArrayProto.push,
        slice            = ArrayProto.slice,
        toString         = ObjProto.toString,
        hasOwnProperty   = ObjProto.hasOwnProperty;

    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    // ES5 ԭ������, ��������֧��, �� underscore �л�����ʹ��
    var
        nativeIsArray      = Array.isArray,
        nativeKeys         = Object.keys,
        nativeBind         = FuncProto.bind,
        nativeCreate       = Object.create;

    // Naked function reference for surrogate-prototype-swapping.
    var Ctor = function(){};

    // Create a safe reference to the Underscore object for use below.
    // ���ĺ���
    // `_` ��ʵ��һ�����캯��
    // ֧���� new ���õĹ��캯����˼�� jQuery ���� new ���ã�
    // ������Ĳ�����ʵ��Ҫ���������ݣ���ֵ�� this._wrapped ����
    var _ = function(obj) {
        // ���¾���� OOP ��ʽ�ĵ���
        // ����Ƿ� OOP ��ʽ�ĵ��ã��������ú����ڲ�

        // ��� obj �Ѿ��� `_` ������ʵ������ֱ�ӷ��� obj
        if (obj instanceof _) return obj;

        // ������� `_` ������ʵ��
        // ����� new �����������ʵ�����Ķ���
        if (!(this instanceof _)) return new _(obj);

        // �� obj ��ֵ�� this._wrapped ����
        this._wrapped = obj;
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object.
    // �����涨��� `_` �ֲ�������ֵ��ȫ�ֶ����е� `_` ����
    // ���ͻ����� window._ = _
    // �����(node)�� exports._ = _
    // ͬʱ�ڷ�����������ϵ� require() API
    // ������¶��ȫ�ֺ�������ȫ�ֻ�����ʹ�� `_` ����(����)
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }

    // Current version.
    // ��ǰ underscore �汾��
    _.VERSION = '1.8.3';

    // Internal function that returns an efficient (for current engines) version
    // of the passed-in callback, to be repeatedly applied in other Underscore
    // functions.
    // underscore �ڲ�����
    // ���� this ָ��context ������
    // �Լ� argCount ����
    // ���β�������һЩ�ص�����������
    var optimizeCb = function(func, context, argCount) {
        // ���û��ָ�� this ָ���򷵻�ԭ����
        if (context === void 0) return func;

        switch (argCount == null ? 3 : argCount) {
            case 1: return function(value) {
                return func.call(context, value);
            };
            case 2: return function(value, other) {
                return func.call(context, value, other);
            };

            // �����ָ�� this����û�д��� argCount ����
            // ��ִ������ case
            // _.each��_.map
            case 3: return function(value, index, collection) {
                return func.call(context, value, index, collection);
            };

            // _.reduce��_.reduceRight
            case 4: return function(accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection);
            };
        }
        return function() {
            return func.apply(context, arguments);
        };
    };

    // A mostly-internal function to generate callbacks that can be applied
    // to each element in a collection, returning the desired result �� either
    // identity, an arbitrary callback, a property matcher, or a property accessor.
    var cb = function(value, context, argCount) {
        if (value == null) return _.identity;
        if (_.isFunction(value)) return optimizeCb(value, context, argCount);
        if (_.isObject(value)) return _.matcher(value);
        return _.property(value);
    };


    _.iteratee = function(value, context) {
        return cb(value, context, Infinity);
    };

    // An internal function for creating assigner functions.
    // �����������õ�������ڲ�����
    // _.extend & _.extendOwn & _.defaults
    // _.extend = createAssigner(_.allKeys);
    // _.extendOwn = _.assign = createAssigner(_.keys);
    // _.defaults = createAssigner(_.allKeys, true);
    var createAssigner = function(keysFunc, undefinedOnly) {
        // ���غ���
        // ����հ���undefinedOnly �����ڷ��صĺ����б����ã�
        // ���صĺ����������� >= 1
        // ���ڶ�����ʼ�Ķ�������ļ�ֵ�� "�̳�" ����һ������
        return function(obj) {
            var length = arguments.length;
            // ֻ������һ������������ 0 ������
            // ���ߴ���ĵ�һ�������� null
            if (length < 2 || obj == null) return obj;

            // ö�ٵ�һ����������Ķ������
            // �� arguments[1], arguments[2] ...
            for (var index = 1; index < length; index++) {
                // source ��Ϊ�������
                var source = arguments[index],
                // ��ȡ��������� keys ֵ
                // keysFunc ������ʾ _.keys
                // ���� _.allKeys
                    keys = keysFunc(source),
                    l = keys.length;

                // �����ö���ļ�ֵ��
                for (var i = 0; i < l; i++) {
                    var key = keys[i];
                    // _.extend �� _.extendOwn ����
                    // û�д��� undefinedOnly �������� !undefinedOnly Ϊ true
                    // ���϶���ִ�� obj[key] = source[key]
                    // �������ļ�ֵ��ֱ�Ӹ��� obj
                    // ==========================================
                    // _.defaults ������undefinedOnly ����Ϊ true
                    // �� !undefinedOnly Ϊ false
                    // ��ô���ҽ��� obj[key] Ϊ undefined ʱ�Ÿ���
                    // ���������ͬ�� key ֵ��ȡ������ֵ� value ֵ
                    // *defaults ������ͬ key ��Ҳ��һ��ȡ�״γ��ֵ�
                    if (!undefinedOnly || obj[key] === void 0)
                        obj[key] = source[key];
                }
            }

            // �����Ѿ��̳к������������Եĵ�һ����������
            return obj;
        };
    };

    // An internal function for creating a new object that inherits from another.
    // use in `_.create`
    var baseCreate = function(prototype) {
        // ��� prototype �������Ƕ���
        if (!_.isObject(prototype)) return {};

        // ��������֧�� ES5 Object.create
        if (nativeCreate) return nativeCreate(prototype);

        Ctor.prototype = prototype;
        var result = new Ctor;
        Ctor.prototype = null;
        return result;
    };

    // �հ�
    var property = function(key) {
        return function(obj) {
            return obj == null ? void 0 : obj[key];
        };
    };

    // Helper for collection methods to determine whether a collection
    // should be iterated as an array or as an object
    // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
    // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094

    // Math.pow(2, 53) - 1 �� JavaScript ���ܾ�ȷ��ʾ���������
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

    // getLength ����
    // �ú�������һ�����������ز����� length ����ֵ
    // ������ȡ array �Լ� arrayLike Ԫ�ص� length ����ֵ
    var getLength = property('length');

    // �ж��Ƿ��� ArrayLike Object
    // �����飬��ӵ�� length ���Բ��� length ����ֵΪ Number ���͵�Ԫ��
    // �������顢arguments��HTML Collection �Լ� NodeList �ȵ�
    // �������� {length: 10} �����Ķ���
    // �����ַ�����������
    var isArrayLike = function(collection) {
        // ���ز��� collection �� length ����ֵ
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };


    // Collection Functions
    // ������߶������չ����
    // �� 25 ����չ����
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles raw objects in addition to array-likes. Treats all
    // sparse array-likes as if they were dense.
    // �� ES5 �� Array.prototype.forEach ʹ�÷�������
    // ����������߶����ÿ��Ԫ��
    // ��һ������Ϊ���飨���������飩���߶���
    // �ڶ�������Ϊ������������������߶���ÿ��Ԫ�ض�ִ�и÷���
    // �÷������ܴ��������������ֱ�Ϊ (item, index, array)��(value, key, obj) for object��
    // �� ES5 �� Array.prototype.forEach �������θ�ʽһ��
    // ��������������ʡ�ԣ�ȷ���ڶ������� iteratee �����еģ������еģ�this ָ��
    // �� iteratee �г��ֵģ�����У����� this ��ָ�� context
    // notice: ��Ҫ����һ������ key ����Ϊ number �Ķ���
    // notice: _.each ���������� return ����ѭ����ͬ����Array.prototype.forEach Ҳ���У�
    _.each = _.forEach = function(obj, iteratee, context) {
        // ���� context ȷ����ͬ�ĵ�������
        iteratee = optimizeCb(iteratee, context);

        var i, length;

        // �����������
        // Ĭ�ϲ��ᴫ������ {length: 10} ����������
        if (isArrayLike(obj)) {
            // ����
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else { // ��� obj �Ƕ���
            // ��ȡ��������� key ֵ
            var keys = _.keys(obj);

            // ����Ƕ������������ values ֵ
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj); // (value, key, obj)
            }
        }

        // ���� obj ����
        // ����ʽ���ã�Returns the list for chaining��
        return obj;
    };

    // Return the results of applying the iteratee to each element.
    // �� ES5 �� Array.prototype.map ʹ�÷�������
    // ������ʽ�� _.each ��������
    // �������飨ÿ��Ԫ�أ����߶����ÿ��Ԫ�أ�value��
    // ��ÿ��Ԫ��ִ�� iteratee ��������
    // ��������浽�µ������У�������
    _.map = _.collect = function(obj, iteratee, context) {
        // ���� context ȷ����ͬ�ĵ�������
        iteratee = cb(iteratee, context);

        // ��������Ƕ������ȡ���� keys ֵ���飨��·���ʽ��
        var keys = !isArrayLike(obj) && _.keys(obj),
        // ��� obj Ϊ������ length Ϊ key.length
        // ��� obj Ϊ���飬�� length Ϊ obj.length
            length = (keys || obj).length,
            results = Array(length); // �������

        // ����
        for (var index = 0; index < length; index++) {
            // ��� obj Ϊ������ currentKey Ϊ�����ֵ key
            // ��� obj Ϊ���飬�� currentKey Ϊ index ֵ
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }

        // �����µĽ������
        return results;
    };

    // Create a reducing function iterating left or right.
    // dir === 1 -> _.reduce
    // dir === -1 -> _.reduceRight
    function createReduce(dir) {
        // Optimized iterator function as using arguments.length
        // in the main function will deoptimize the, see #1991.
        function iterator(obj, iteratee, memo, keys, index, length) {
            for (; index >= 0 && index < length; index += dir) {
                var currentKey = keys ? keys[index] : index;
                // ����������ֵ���´ε�������
                memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }
            // ÿ�ε�������ֵ�����´ε�������
            return memo;
        }

        // _.reduce��_.reduceRight���ɴ���� 4 ������
        // obj ������߶���
        // iteratee ������������������߶���ÿ��Ԫ��ִ�и÷���
        // memo ��ʼֵ������У���� obj ��һ��Ԫ�ؿ�ʼ����
        // ���û�У���� obj �ڶ���Ԫ�ؿ�ʼ����������һ��Ԫ����Ϊ��ʼֵ
        // context Ϊ���������е� this ָ��
        return function(obj, iteratee, memo, context) {
            iteratee = optimizeCb(iteratee, context, 4);
            var keys = !isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                index = dir > 0 ? 0 : length - 1;

            // Determine the initial value if none is provided.
            // ���û��ָ����ʼֵ
            // ��ѵ�һ��Ԫ��ָ��Ϊ��ʼֵ
            if (arguments.length < 3) {
                memo = obj[keys ? keys[index] : index];
                // ���� dir ȷ�������������ұ���
                index += dir;
            }

            return iterator(obj, iteratee, memo, keys, index, length);
        };
    }

    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`.
    // �� ES5 �� Array.prototype.reduce ʹ�÷�������
    // _.reduce(list, iteratee, [memo], [context])
    // _.reduce �������ɴ��� 4 ������
    // memo Ϊ��ʼֵ����ѡ
    // context Ϊָ�� iteratee �� this ָ�򣬿�ѡ
    _.reduce = _.foldl = _.inject = createReduce(1);

    // The right-associative version of reduce, also known as `foldr`.
    // �� ES5 �� Array.prototype.reduceRight ʹ�÷�������
    _.reduceRight = _.foldr = createReduce(-1);

    // Return the first value which passes a truth test. Aliased as `detect`.
    // Ѱ��������߶����е�һ������������predicate �������� true����Ԫ��
    // �����ظ�Ԫ��ֵ
    // _.find(list, predicate, [context])
    _.find = _.detect = function(obj, predicate, context) {
        var key;
        // ��� obj �����飬key Ϊ�����������±�
        if (isArrayLike(obj)) {
            key = _.findIndex(obj, predicate, context);
        } else {
            // ��� obj �Ƕ���key Ϊ����������Ԫ�ص� key ֵ
            key = _.findKey(obj, predicate, context);
        }

        // �����Ԫ�ش��ڣ��򷵻ظ�Ԫ��
        // ��������ڣ���Ĭ�Ϸ��� undefined������û�з��أ������� undefined��
        if (key !== void 0 && key !== -1) return obj[key];
    };

    // Return all the elements that pass a truth test.
    // Aliased as `select`.
    // �� ES5 �� Array.prototype.filter ʹ�÷�������
    // Ѱ��������߶�������������������Ԫ��
    // ��������飬�� `Ԫ��ֵ` ��������
    // ����Ƕ����� `value ֵ` ��������
    // ���ظ�����
    // _.filter(list, predicate, [context])
    _.filter = _.select = function(obj, predicate, context) {
        var results = [];

        // ���� this ָ�򣬷��� predicate �������жϺ�����
        predicate = cb(predicate, context);

        // ����ÿ��Ԫ�أ���������������������
        _.each(obj, function(value, index, list) {
            if (predicate(value, index, list)) results.push(value);
        });

        return results;
    };

    // Return all the elements for which a truth test fails.
    // Ѱ��������߶��������в�����������Ԫ��
    // �������鷽ʽ����
    // ���ý���� _.filter �����Ĳ���
    _.reject = function(obj, predicate, context) {
        return _.filter(obj, _.negate(cb(predicate)), context);
    };

    // Determine whether all of the elements match a truth test.
    // Aliased as `all`.
    // �� ES5 �е� Array.prototype.every ��������
    // �ж������е�ÿ��Ԫ�ػ��߶�����ÿ�� value ֵ�Ƿ����� predicate �����е��ж�����
    // ����ǣ��򷵻� ture�����򷵻� false����һ��������ͷ��� false��
    // _.every(list, [predicate], [context])
    _.every = _.all = function(obj, predicate, context) {
        // ���� this ָ�򣬷�����Ӧ predicate ����
        predicate = cb(predicate, context);

        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;

        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            // �����һ���������� predicate �е�����
            // �򷵻� false
            if (!predicate(obj[currentKey], currentKey, obj))
                return false;
        }

        return true;
    };

    // Determine if at least one element in the object matches a truth test.
    // Aliased as `any`.
    // �� ES5 �� Array.prototype.some ��������
    // �ж�������߶������Ƿ���һ��Ԫ�أ�value ֵ for object������ predicate �����е�����
    // ������򷵻� true�����򷵻� false
    // _.some(list, [predicate], [context])
    _.some = _.any = function(obj, predicate, context) {
        // ���� context ���� predicate ����
        predicate = cb(predicate, context);
        // ��������Ƕ����򷵻ظö���� keys ����
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            // �����һ��Ԫ�������������򷵻� true
            if (predicate(obj[currentKey], currentKey, obj)) return true;
        }
        return false;
    };

    // Determine if the array or object contains a given item (using `===`).
    // Aliased as `includes` and `include`.
    // �ж�������߶����У�value ֵ���Ƿ���ָ��Ԫ��
    // ����� object������� key ֵ��ֻ��Ҫ���� value ֵ����
    // ���� obj ���Ƿ���ָ���� value ֵ
    // ���ز���ֵ
    _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
        // ����Ƕ��󣬷��� values ��ɵ�����
        if (!isArrayLike(obj)) obj = _.values(obj);

        // fromIndex ��ʾ��ѯ��ʼλ��
        // ���û��ָ���ò�������Ĭ�ϴ�ͷ����
        if (typeof fromIndex != 'number' || guard) fromIndex = 0;

        // _.indexOf ���������չ������Array Functions��
        // ������Ѱ��ĳһԪ��
        return _.indexOf(obj, item, fromIndex) >= 0;
    };

    // Invoke a method (with arguments) on every item in a collection.
    // Calls the method named by methodName on each value in the list.
    // Any extra arguments passed to invoke will be forwarded on to the method invocation.
    // ������߶����е�ÿ��Ԫ�ض����� method ����
    // ���ص��ú�Ľ����������߹������飩
    // method ������Ĳ����ᱻ������������ method ������
    // _.invoke(list, methodName, *arguments)
    _.invoke = function(obj, method) {
        // *arguments ����
        var args = slice.call(arguments, 2);

        // �ж� method �ǲ��Ǻ���
        var isFunc = _.isFunction(method);

        // �� map ������������߶���ÿ��Ԫ�ص��÷���
        // ��������
        return _.map(obj, function(value) {
            // ��� method ���Ǻ������������ obj �� key ֵ
            // �� obj[method] ����Ϊ����
            var func = isFunc ? method : value[method];
            return func == null ? func : func.apply(value, args);
        });
    };

    // Convenience version of a common use case of `map`: fetching a property.
    // һ�����飬Ԫ�ض��Ƕ���
    // ����ָ���� key ֵ
    // ����һ�����飬Ԫ�ض���ָ�� key ֵ�� value ֵ
    /*
     var property = function(key) {
     return function(obj) {
     return obj == null ? void 0 : obj[key];
     };
     };
     */
    // _.pluck(list, propertyName)
    _.pluck = function(obj, key) {
        return _.map(obj, _.property(key));
    };

    // Convenience version of a common use case of `filter`: selecting only objects
    // containing specific `key:value` pairs.
    // ����ָ���ļ�ֵ��
    // ѡ�����
    _.where = function(obj, attrs) {
        return _.filter(obj, _.matcher(attrs));
    };

    // Convenience version of a common use case of `find`: getting the first object
    // containing specific `key:value` pairs.
    // Ѱ�ҵ�һ����ָ�� key-value ��ֵ�ԵĶ���
    _.findWhere = function(obj, attrs) {
        return _.find(obj, _.matcher(attrs));
    };

    // Return the maximum element (or element-based computation).
    // Ѱ�������е����Ԫ��
    // ���߶����е���� value ֵ
    // ����� iteratee ����������ÿ��Ԫ�ؾ����ú������������ֵ
    // _.max(list, [iteratee], [context])
    _.max = function(obj, iteratee, context) {
        var result = -Infinity, lastComputed = -Infinity,
            value, computed;

        // ������Ѱ����ֵ
        if (iteratee == null && obj != null) {
            // ��������飬��Ѱ�����������Ԫ��
            // ����Ƕ�����Ѱ����� value ֵ
            obj = isArrayLike(obj) ? obj : _.values(obj);

            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value > result) {
                    result = value;
                }
            }
        } else {  // Ѱ��Ԫ�ؾ������������ֵ
            iteratee = cb(iteratee, context);

            // result ������Ԫ��
            // lastComputed �����������г��ֵ���ֵ
            // ����Ԫ��
            _.each(obj, function(value, index, list) {
                // ���������������ֵ
                computed = iteratee(value, index, list);
                // && �����ȼ����� ||
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }

        return result;
    };

    // Return the minimum element (or element-based computation).
    // Ѱ����С��Ԫ��
    // ���� _.max
    // _.min(list, [iteratee], [context])
    _.min = function(obj, iteratee, context) {
        var result = Infinity, lastComputed = Infinity,
            value, computed;
        if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value < result) {
                    result = value;
                }
            }
        } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function(value, index, list) {
                computed = iteratee(value, index, list);
                if (computed < lastComputed || computed === Infinity && result === Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Shuffle a collection, using the modern version of the
    // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher�CYates_shuffle).
    // ����������
    // ����Ƕ����򷵻�һ�����飬�����ɶ��� value ֵ����
    // Fisher-Yates shuffle �㷨
    // ���ŵ�ϴ���㷨�����Ӷ� O(n)
    // ����Ҫ�� sort + Math.random()�����Ӷ� O(nlogn)
    // ���ң�����������������
    // @see https://github.com/hanzichi/underscore-analysis/issues/15
    _.shuffle = function(obj) {
        // ����Ƕ������ value ֵ��������
        var set = isArrayLike(obj) ? obj : _.values(obj);
        var length = set.length;

        // ����󷵻ص����鸱���������Ƕ����򷵻������� value ���飩
        var shuffled = Array(length);

        // ö��Ԫ��
        for (var index = 0, rand; index < length; index++) {
            // ����ǰ��ö��λ�õ�Ԫ�غ� `index=rand` λ�õ�Ԫ�ؽ���
            rand = _.random(0, index);
            if (rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = set[index];
        }

        return shuffled;
    };

    // Sample **n** random values from a collection.
    // If **n** is not specified, returns a single random element.
    // The internal `guard` argument allows it to work with `map`.
    // �������������߶����е�һ��Ԫ��
    // ���ָ���˲��� `n`����������� n ��Ԫ����ɵ�����
    // ��������Ƕ����������� values ���
    _.sample = function(obj, n, guard) {
        // �������һ��Ԫ��
        if (n == null || guard) {
            if (!isArrayLike(obj)) obj = _.values(obj);
            return obj[_.random(obj.length - 1)];
        }

        // ������� n ��
        return _.shuffle(obj).slice(0, Math.max(0, n));
    };

    // Sort the object's values by a criterion produced by an iteratee.
    // ����
    // _.sortBy(list, iteratee, [context])
    _.sortBy = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);

        // ����ָ���� key ���� values ����
        // _.pluck([{}, {}, {}], 'value')
        return _.pluck(
            // _.map(obj, function(){}).sort()
            // _.map ��Ľ�� [{}, {}..]
            // sort ��Ľ�� [{}, {}..]
            _.map(obj, function(value, index, list) {
                return {
                    value: value,
                    index: index,
                    // Ԫ�ؾ������������������ֵ
                    criteria: iteratee(value, index, list)
                };
            }).sort(function(left, right) {
                var a = left.criteria;
                var b = right.criteria;
                if (a !== b) {
                    if (a > b || a === void 0) return 1;
                    if (a < b || b === void 0) return -1;
                }
                return left.index - right.index;
            }), 'value');

    };

    // An internal function used for aggregate "group by" operations.
    // behavior ��һ����������
    // _.groupBy, _.indexBy �Լ� _.countBy ��ʵ���Ƕ�����Ԫ�ؽ��з���
    // ���������� behavior ����
    var group = function(behavior) {
        return function(obj, iteratee, context) {
            // ���ؽ����һ������
            var result = {};
            iteratee = cb(iteratee, context);
            // ����Ԫ��
            _.each(obj, function(value, index) {
                // ������������ȡ���ֵ����Ϊ key
                var key = iteratee(value, index, obj);
                // ���ղ�ͬ�Ĺ�����з������
                // ������ result �����������룬���� behavior �иı��ֵ
                behavior(result, value, key);
            });
            // ���ؽ������
            return result;
        };
    };

    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    // groupBy_  _.groupBy(list, iteratee, [context])
    // �����ض������������߶����е�Ԫ�ؽ��з���
    // result �Ƿ��ض���
    // value ������Ԫ��
    // key �ǵ������ֵ
    _.groupBy = group(function(result, value, key) {
        // ���� key ֵ����
        // key ��Ԫ�ؾ��������������ֵ
        // ����Ԫ�����������ֵ

        // result �����Ѿ��и� key ֵ��
        if (_.has(result, key))
            result[key].push(value);
        else result[key] = [value];
    });

    // Indexes the object's values by a criterion, similar to `groupBy`, but for
    // when you know that your index values will be unique.
    _.indexBy = group(function(result, value, key) {
        // key ֵ�����Ƕ�һ�޶���
        // ��Ȼ����ĻḲ��ǰ���
        // ������ _.groupBy ����
        result[key] = value;
    });

    // Counts instances of an object that group by a certain criterion. Pass
    // either a string attribute to count by, or a function that returns the
    // criterion.
    _.countBy = group(function(result, value, key) {
        // ��ͬ key ֵԪ������
        if (_.has(result, key))
            result[key]++;
        else result[key] = 1;
    });

    // Safely create a real, live array from anything iterable.
    // α���� -> ����
    // ���� -> ��ȡ value ֵ�������
    // ��������
    _.toArray = function(obj) {
        if (!obj) return [];

        // ��������飬�򷵻ظ�������
        // �Ƿ��� obj.concat() �����㣿
        if (_.isArray(obj)) return slice.call(obj);

        // ����������飬�����¹����µ�����
        // �Ƿ�Ҳ����ֱ���� slice ������
        if (isArrayLike(obj)) return _.map(obj, _.identity);

        // ����Ƕ����򷵻� values ����
        return _.values(obj);
    };

    // Return the number of elements in an object.
    // ��������飨�����飩�����س��ȣ�length ���ԣ�
    // ����Ƕ��󣬷��ؼ�ֵ������
    _.size = function(obj) {
        if (obj == null) return 0;
        return isArrayLike(obj) ? obj.length : _.keys(obj).length;
    };

    // Split a collection into two arrays: one whose elements all satisfy the given
    // predicate, and one whose elements all do not satisfy the predicate.
    // ��������߶����з���������predicate����Ԫ��
    // �Ͳ�����������Ԫ�أ�����ΪԪ�أ�����Ϊ value ֵ��
    // �ֱ��������������
    // ����һ�����飬����Ԫ��Ϊ�����������飨[[pass array], [fail array]]��
    _.partition = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var pass = [], fail = [];
        _.each(obj, function(value, key, obj) {
            (predicate(value, key, obj) ? pass : fail).push(value);
        });
        return [pass, fail];
    };


    // Array Functions
    // �������չ����
    // �� 20 ����չ����
    // Note: All array functions will also work on the arguments object.
    // However, Underscore functions are not designed to work on "sparse" arrays.
    // ---------------

    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.
    // ���������һ��Ԫ��
    // ����в��� n���򷵻�����ǰ n ��Ԫ�أ���ɵ����飩
    _.first = _.head = _.take = function(array, n, guard) {
        // �ݴ�����Ϊ���򷵻� undefined
        if (array == null) return void 0;

        // ûָ������ n����Ĭ�Ϸ��ص�һ��Ԫ��
        if (n == null || guard) return array[0];

        // ���������� n���򷵻�ǰ n ��Ԫ����ɵ�����
        // ����ǰ n ��Ԫ�أ����޳��� array.length - n ��Ԫ��
        return _.initial(array, array.length - n);
    };

    // Returns everything but the last entry of the array. Especially useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N.
    // ����һ������
    // �����޳����һ��Ԫ��֮������鸱��
    // ���������� n�����޳���� n ��Ԫ��
    _.initial = function(array, n, guard) {
        return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };

    // Get the last element of an array. Passing **n** will return the last N
    // values in the array.
    // �����������һ��Ԫ��
    // ���������� n
    // �򷵻ظ������ n ��Ԫ����ɵ�����
    // ���޳�ǰ array.length - n ��Ԫ��
    _.last = function(array, n, guard) {
        // �ݴ�
        if (array == null) return void 0;

        // ���û��ָ������ n���򷵻����һ��Ԫ��
        if (n == null || guard) return array[array.length - 1];

        // ���������� n���򷵻غ� n ��Ԫ����ɵ�����
        // ���޳�ǰ array.length - n ��Ԫ��
        return _.rest(array, Math.max(0, array.length - n));
    };

    // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
    // Especially useful on the arguments object. Passing an **n** will return
    // the rest N values in the array.
    // ����һ������
    // �����޳���һ��Ԫ�غ�����鸱��
    // ���������� n�����޳�ǰ n ��Ԫ��
    _.rest = _.tail = _.drop = function(array, n, guard) {
        return slice.call(array, n == null || guard ? 1 : n);
    };

    // Trim out all falsy values from an array.
    // ȥ�����������еļ�ֵ
    // �������鸱��
    // JavaScript �еļ�ֵ���� false��null��undefined��''��NaN��0
    // ���� PHP �е� array_filter() ����
    // _.identity = function(value) {
    //   return value;
    // };
    _.compact = function(array) {
        return _.filter(array, _.identity);
    };

    // Internal implementation of a recursive `flatten` function.
    // �ݹ�������飬������չ��
    // �� [1, 2, [3, 4]] => [1, 2, 3, 4]
    // flatten(array, shallow, false)
    // flatten(arguments, true, true, 1)
    // flatten(arguments, true, true)
    // flatten(arguments, false, false, 1)
    // ===== //
    // input => Array ���� arguments
    // shallow => �Ƿ�ֻչ��һ��
    // strict === true��ͨ���� shallow === true ���ʹ��
    // ��ʾֻչ��һ�㣬���ǲ����������Ԫ�أ����޷�չ���Ļ������ͣ�
    // flatten([[1, 2], 3, 4], true, true) => [1, 2]
    // flatten([[1, 2], 3, 4], false, true) = > []
    // startIndex => �� input �ĵڼ��ʼչ��
    // ===== //
    // ���Կ�������� strict ����Ϊ true����ô shallow ҲΪ true
    // Ҳ����չ��һ�㣬ͬʱ�ѷ��������
    // [[1, 2], [3, 4], 5, 6] => [1, 2, 3, 4]
    var flatten = function(input, shallow, strict, startIndex) {
        // output ���鱣����
        // �� flatten ������������
        // idx Ϊ output ���ۼ������±�
        var output = [], idx = 0;

        // ���� startIndex ����ȷ����Ҫչ������ʼλ��
        for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
            var value = input[i];
            // ���� ���� arguments
            // ע�� isArrayLike ������ {length: 10} �����ģ����˵�
            if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                // flatten current level of array or arguments object
                // (!shallow === true) => (shallow === false)
                // ���ʾ�����չ��
                // �����ݹ�չ��
                if (!shallow)
                // flatten ������������
                // �����涨��� value ���¸�ֵ
                    value = flatten(value, shallow, strict);

                // �ݹ�չ�������һ�㣨û��Ƕ�׵������ˣ�
                // ���� (shallow === true) => ֻչ��һ��
                // value ֵ�϶���һ������
                var j = 0, len = value.length;

                // ��һ��ò��û�б�Ҫ
                // �Ͼ� JavaScript ��������Զ�����
                // ��������д���о��ȽϺã�����Ԫ�ص� push �����и��Ƚ���������ʶ
                output.length += len;

                // �� value �����Ԫ����ӵ� output ������
                while (j < len) {
                    output[idx++] = value[j++];
                }
            } else if (!strict) {
                // (!strict === true) => (strict === false)
                // ��������չ������ shallow ����Ϊ false
                // ��ô����� value �������飬�ǻ�������ʱ
                // �϶����ߵ���� else-if �ж���
                // �������ʱ strict Ϊ true���������������֧�ڲ�
                // ���� shallow === false ����� strict === true ����
                // ���� flatten �����õ��Ľ����Զ�ǿ����� []
                output[idx++] = value;
            }
        }

        return output;
    };

    // Flatten out an array, either recursively (by default), or just one level.
    // ��Ƕ�׵�����չ��
    // ������� (shallow === true)�����չ��һ��
    // _.flatten([1, [2], [3, [[4]]]]);
    // => [1, 2, 3, 4];
    // ====== //
    // _.flatten([1, [2], [3, [[4]]]], true);
    // => [1, 2, 3, [[4]]];
    _.flatten = function(array, shallow) {
        // array => ��Ҫչ��������
        // shallow => �Ƿ�ֻչ��һ��
        // false Ϊ flatten ���� strict ����
        return flatten(array, shallow, false);
    };

    // Return a version of the array that does not contain the specified value(s).
    // without_.without(array, *values)
    // Returns a copy of the array with all instances of the values removed.
    // ====== //
    // _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
    // => [2, 3, 4]
    // ===== //
    // ���������Ƴ�ָ����Ԫ��
    // �����Ƴ�������鸱��
    _.without = function(array) {
        // slice.call(arguments, 1)
        // �� arguments תΪ���飨ͬʱȥ����һ��Ԫ�أ�
        // ֮�����Ե��� _.difference ����
        return _.difference(array, slice.call(arguments, 1));
    };

    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    // ����ȥ��
    // ����ڶ������� `isSorted` Ϊ true
    // ��˵�������Ѿ�֪����������
    // �������һ��������㷨��һ�����ԱȽϣ�Ԫ�غ�����ǰһ��Ԫ�رȽϼ��ɣ�
    // ����е��������� iteratee���������ÿ��Ԫ�ص���
    // �Ե���֮��Ľ������ȥ��
    // ����ȥ�غ�����飨array �������飩
    // PS: ��¶�� API ��û context ����
    // _.uniq(array, [isSorted], [iteratee])
    _.uniq = _.unique = function(array, isSorted, iteratee, context) {
        // û�д��� isSorted ����
        // תΪ _.unique(array, false, undefined, iteratee)
        if (!_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }

        // ����е�������
        // ����� this ָ����η����µĵ�������
        if (iteratee != null)
            iteratee = cb(iteratee, context);

        // ������飬�� array ���Ӽ�
        var result = [];

        // �Ѿ����ֹ���Ԫ�أ����߾�����������ֵ��
        // ���������ظ�ֵ
        var seen = [];

        for (var i = 0, length = getLength(array); i < length; i++) {
            var value = array[i],
            // ���ָ���˵�������
            // �������ÿһ��Ԫ�ؽ��е���
            // ���������������������ͨ���� value, index, array ��ʽ
                computed = iteratee ? iteratee(value, i, array) : value;

            // ������������飬��ǰԪ��ֻ�����һ��Ԫ�ضԱȼ���
            // �� seen ����������һ��Ԫ��
            if (isSorted) {
                // ��� i === 0���ǵ�һ��Ԫ�أ���ֱ�� push
                // ����Ƚϵ�ǰԪ���Ƿ��ǰһ��Ԫ�����
                if (!i || seen !== computed) result.push(value);
                // seen ���浱ǰԪ�أ�����һ�ζԱ�
                seen = computed;
            } else if (iteratee) {
                // ��� seen[] ��û�� computed ���Ԫ��ֵ
                if (!_.contains(seen, computed)) {
                    seen.push(computed);
                    result.push(value);
                }
            } else if (!_.contains(result, value)) {
                // ������þ��������������㣬Ҳ�Ͳ��� seen[] ������
                result.push(value);
            }
        }

        return result;
    };

    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    // union_.union(*arrays)
    // Computes the union of the passed-in arrays:
    // the list of unique items, in order, that are present in one or more of the arrays.
    // ========== //
    // _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
    // => [1, 2, 3, 101, 10]
    // ========== //
    // ����������Ԫ�ؼ��е�һ��������
    // ����ȥ�أ��������鸱��
    _.union = function() {
        // ������ flatten ���������������չ����һ������
        // Ȼ��Ϳ������ص��� _.uniq ������
        // ���� _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
        // arguments Ϊ [[1, 2, 3], [101, 2, 1, 10], [2, 1]]
        // shallow ����Ϊ true��չ��һ��
        // ���Ϊ [1, 2, 3, 101, 2, 1, 10, 2, 1]
        // Ȼ�����ȥ��
        return _.uniq(flatten(arguments, true, true));
    };

    // Produce an array that contains every item shared between all the
    // passed-in arrays.
    // Ѱ�Ҽ��������й��е�Ԫ��
    // ����Щÿ�������ж��е�Ԫ�ش�����һ�������з���
    // _.intersection(*arrays)
    // _.intersection([1, 2, 3, 1], [101, 2, 1, 10, 1], [2, 1, 1])
    // => [1, 2]
    // ע�⣺���صĽ��������ȥ�ص�
    _.intersection = function(array) {
        // �������
        var result = [];

        // ����Ĳ��������飩����
        var argsLength = arguments.length;

        // ������һ�������Ԫ��
        for (var i = 0, length = getLength(array); i < length; i++) {
            var item = array[i];

            // ��� result[] ���Ѿ��� item Ԫ���ˣ�continue
            // �� array �г�������ͬ��Ԫ��
            // ���ص� result[] ��ʵ�Ǹ� "����"����ȥ�صģ�
            if (_.contains(result, item)) continue;

            // �ж����������������Ƿ��� item ���Ԫ��
            for (var j = 1; j < argsLength; j++) {
                if (!_.contains(arguments[j], item)) break;
            }

            // �������������������
            // j === argsLength ˵���������������ж��� item Ԫ��
            // ������� result[] ��
            if (j === argsLength) result.push(item);
        }

        return result;
    };

    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    // _.difference(array, *others)
    // Similar to without, but returns the values from array that are not present in the other arrays.
    // ===== //
    // _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
    // => [1, 3, 4]
    // ===== //
    // �޳� array �������� others �����г��ֵ�Ԫ��
    _.difference = function(array) {
        // �� others ����չ��һ��
        // rest[] ����չ�����Ԫ����ɵ�����
        // strict ����Ϊ true
        // ������������ _.difference([1, 2, 3, 4, 5], [5, 2], 10);
        // 10 �ͻ�ȡ����
        var rest = flatten(arguments, true, true, 1);

        // ���� array������
        return _.filter(array, function(value){
            // ��� value ������ rest �У�����˵�
            return !_.contains(rest, value);
        });
    };

    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    // ===== //
    // _.zip(['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]);
    // => [["moe", 30, true], ["larry", 40, false], ["curly", 50, false]]
    // ===== //
    // �������������ͬλ�õ�Ԫ�ع���
    // ����һ������
    _.zip = function() {
        return _.unzip(arguments);
    };

    // Complement of _.zip. Unzip accepts an array of arrays and groups
    // each array's elements on shared indices
    // The opposite of zip. Given an array of arrays,
    // returns a series of new arrays,
    // the first of which contains all of the first elements in the input arrays,
    // the second of which contains all of the second elements, and so on.
    // ===== //
    // _.unzip([["moe", 30, true], ["larry", 40, false], ["curly", 50, false]]);
    // => [['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]]
    // ===== //
    _.unzip = function(array) {
        var length = array && _.max(array, getLength).length || 0;
        var result = Array(length);

        for (var index = 0; index < length; index++) {
            result[index] = _.pluck(array, index);
        }
        return result;
    };

    // Converts lists into objects. Pass either a single array of `[key, value]`
    // pairs, or two parallel arrays of the same length -- one of keys, and one of
    // the corresponding values.
    // ������ת��Ϊ����
    _.object = function(list, values) {
        var result = {};
        for (var i = 0, length = getLength(list); i < length; i++) {
            if (values) {
                result[list[i]] = values[i];
            } else {
                result[list[i][0]] = list[i][1];
            }
        }
        return result;
    };

    // Generator function to create the findIndex and findLastIndex functions
    // (dir === 1) => ��ǰ������
    // (dir === -1) => �Ӻ���ǰ��
    function createPredicateIndexFinder(dir) {
        // ����հ�
        return function(array, predicate, context) {
            predicate = cb(predicate, context);

            var length = getLength(array);

            // ���� dir ������ȷ�������������ʼλ��
            var index = dir > 0 ? 0 : length - 1;

            for (; index >= 0 && index < length; index += dir) {
                // �ҵ���һ������������Ԫ��
                // �������±�ֵ
                if (predicate(array[index], index, array))
                    return index;
            }

            return -1;
        };
    }

    // Returns the first index on an array-like that passes a predicate test
    // ��ǰ�����ҵ������� `��һ����������` ��Ԫ�أ��������±�ֵ
    // û�ҵ����� -1
    // _.findIndex(array, predicate, [context])
    _.findIndex = createPredicateIndexFinder(1);

    // �Ӻ���ǰ�ҵ������� `��һ����������` ��Ԫ�أ��������±�ֵ
    // û�ҵ����� -1
    // _.findLastIndex(array, predicate, [context])
    _.findLastIndex = createPredicateIndexFinder(-1);

    // Use a comparator function to figure out the smallest index at which
    // an object should be inserted so as to maintain order. Uses binary search.
    // The iteratee may also be the string name of the property to sort by (eg. length).
    // ===== //
    // _.sortedIndex([10, 20, 30, 40, 50], 35);
    // => 3
    // ===== //
    // var stooges = [{name: 'moe', age: 40}, {name: 'curly', age: 60}];
    // _.sortedIndex(stooges, {name: 'larry', age: 50}, 'age');
    // => 1
    // ===== //
    // ���ֲ���
    // ��һ��Ԫ�ز��������������
    // ���ظò����λ���±�
    // _.sortedIndex(list, value, [iteratee], [context])
    _.sortedIndex = function(array, obj, iteratee, context) {
        // ע�� cb ����
        // iteratee Ϊ�� || Ϊ String ���ͣ�key ֵ��ʱ�᷵�ز�ͬ����
        iteratee = cb(iteratee, context, 1);

        // �����������������ֵ
        // �ɴ�ӡ iteratee ��������
        var value = iteratee(obj);

        var low = 0, high = getLength(array);

        // ���ֲ���
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (iteratee(array[mid]) < value)
                low = mid + 1;
            else
                high = mid;
        }

        return low;
    };

    // Generator function to create the indexOf and lastIndexOf functions
    // _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
    // _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);
    function createIndexFinder(dir, predicateFind, sortedIndex) {

        // API ������ʽ
        // _.indexOf(array, value, [isSorted])
        // _.indexOf(array, value, [fromIndex])
        // _.lastIndexOf(array, value, [fromIndex])
        return function(array, item, idx) {
            var i = 0, length = getLength(array);

            // ��� idx Ϊ Number ����
            // ��涨����λ�õ���ʼ��
            // ��ô�������������� [isSorted]
            // ���Բ����ö��ֲ����Ż���
            // ֻ�ܱ�������
            if (typeof idx == 'number') {
                if (dir > 0) { // �������
                    // ���ò��ҵ���ʼλ��
                    i = idx >= 0 ? idx : Math.max(idx + length, i);
                } else { // �������
                    // ����Ƿ�����ң����� length ����ֵ
                    length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
                }
            } else if (sortedIndex && idx && length) {
                // ���ö��ֲ��Ҽ��ٵ�����
                // ���� & idx !== 0 && length !== 0

                // �� _.sortIndex �ҵ����������� item ���ò����λ��
                idx = sortedIndex(array, item);

                // ������ò����λ�õ�ֵ�� item �պ����
                // ˵����λ�þ��� item ��һ�γ��ֵ�λ��
                // �����±�
                // ������û�ҵ������� -1
                return array[idx] === item ? idx : -1;
            }

            // ���У����Ҫ���ҵ�Ԫ���� NaN ����
            // ��� item !== item
            // ��ô item => NaN
            if (item !== item) {
                idx = predicateFind(slice.call(array, i, length), _.isNaN);
                return idx >= 0 ? idx + i : -1;
            }

            // O(n) ��������
            // Ѱ�Һ� item ��ͬ��Ԫ��
            // �����ų��� item Ϊ NaN �����
            // ���Է��ĵ��� `===` ���ж��Ƿ������
            for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
                if (array[idx] === item) return idx;
            }

            return -1;
        };
    }

    // Return the position of the first occurrence of an item in an array,
    // or -1 if the item is not included in the array.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    // _.indexOf(array, value, [isSorted])
    // �ҵ����� array �� value ��һ�γ��ֵ�λ��
    // ���������±�ֵ
    // �������������������������Դ��� true
    // �����㷨Ч�ʻ���ߣ����ֲ��ң�
    // [isSorted] ������ʾ�����Ƿ�����
    // ͬʱ����������Ҳ���Ա�ʾ [fromIndex] ��������� _.lastIndexOf��
    _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);

    // �� _indexOf ����
    // �������
    // _.lastIndexOf(array, value, [fromIndex])
    // [fromIndex] ������ʾ�ӵ����ڼ�����ʼ��ǰ��
    _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    // ����ĳһ����Χ�ڵ�����ɵ�����
    _.range = function(start, stop, step) {
        if (stop == null) {
            stop = start || 0;
            start = 0;
        }

        step = step || 1;

        // ��������ĳ���
        var length = Math.max(Math.ceil((stop - start) / step), 0);

        // ���ص�����
        var range = Array(length);

        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }

        return range;
    };


    // Function (ahem) Functions
    // ��������չ����
    // �� 14 ����չ����
    // ------------------

    // Determines whether to execute a function as a constructor
    // or a normal function with the provided arguments
    var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
        // �� new ���� _.bind ���صķ������� bound��
        // callingContext ���� boundFunc ��һ��ʵ��
        if (!(callingContext instanceof boundFunc))
            return sourceFunc.apply(context, args);

        // ������� new ���� _.bind ���صķ���

        // self Ϊ sourceFunc ��ʵ�����̳�������ԭ����
        // self ��������һ���ն��󣨻�û��ֵ����������ԭ����
        var self = baseCreate(sourceFunc.prototype);

        // �� new ����һ�����캯����ʵ��
        // �����������û�з���ֵ�ģ��� result ֵΪ undefined
        // ������캯���з���ֵ
        // �������ֵ�Ƕ��󣨷� null������ new �Ľ�������������
        // ���򷵻�ʵ��
        // @see http://www.cnblogs.com/zichi/p/4392944.html
        var result = sourceFunc.apply(self, args);

        // ������캯�������˶���
        // �� new �Ľ�����������
        // �����������
        if (_.isObject(result)) return result;

        // ���򷵻� self
        // var result = sourceFunc.apply(self, args);
        // self ��������������
        // ��ֱ�Ӹı�ֵ
        return self;
    };

    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
    // available.
    // ES5 bind ��������չ��polyfill��
    // �� func �е� this ָ�� context������
    // _.bind(function, object, *arguments)
    // ��ѡ�� arguments �����ᱻ���� func �Ĳ�������
    // func �ڵ���ʱ���������� arguments ������Ȼ��ʹ�� _.bind ���ط���������Ĳ���
    _.bind = function(func, context) {
        // ��������֧�� ES5 bind ���������� func �ϵ� bind ����û�б���д
        // ������ʹ��ԭ���� bind ����
        if (nativeBind && func.bind === nativeBind)
            return nativeBind.apply(func, slice.call(arguments, 1));

        // �������Ĳ��� func ���Ƿ��������׳�����
        if (!_.isFunction(func))
            throw new TypeError('Bind must be called on a function');

        // polyfill
        // ����հ����������غ���
        // args ��ȡ����ʹ�õĲ���
        var args = slice.call(arguments, 2);
        var bound = function() {
            // args.concat(slice.call(arguments))
            // ���պ�����ʵ�ʵ��ò��������������
            // һ�����Ǵ��� _.bind �Ĳ������ᱻ���ȵ��ã�
            // ��һ�����Ǵ��� bound��_.bind �����ط������Ĳ���
            return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
        };

        return bound;
    };

    // Partially apply a function by creating a version that has had some of its
    // arguments pre-filled, without changing its dynamic `this` context. _ acts
    // as a placeholder, allowing any combination of arguments to be pre-filled.
    // _.partial(function, *arguments)
    // _.partial �ܷ���һ������
    // pre-fill �÷�����һЩ����
    _.partial = function(func) {
        // ��ȡϣ�� pre-fill �Ĳ���
        // ���������� _�������λ�õĲ�����ʱ���ţ��ȴ��ֶ�����
        var boundArgs = slice.call(arguments, 1);

        var bound = function() {
            var position = 0, length = boundArgs.length;
            var args = Array(length);
            for (var i = 0; i < length; i++) {
                // �����λ�õĲ���Ϊ _������ bound �����Ĳ���������λ��
                // args Ϊ���� _.partial ������ pre-fill �Ĳ��� & bound ������ arguments
                args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
            }

            // bound ��������ʣ��� arguments������ȥ
            while (position < arguments.length)
                args.push(arguments[position++]);

            return executeBound(func, bound, this, this, args);
        };

        return bound;
    };

    // Bind a number of an object's methods to that object. Remaining arguments
    // are the method names to be bound. Useful for ensuring that all callbacks
    // defined on an object belong to it.
    // ָ��һϵ�з�����methodNames���е� this ָ��object��
    // _.bindAll(object, *methodNames)
    _.bindAll = function(obj) {
        var i, length = arguments.length, key;

        // ���ֻ������һ��������obj����û�д��� methodNames���򱨴�
        if (length <= 1) throw new Error('bindAll must be passed function names');

        // ���� methodNames
        for (i = 1; i < length; i++) {
            key = arguments[i];
            // �����
            obj[key] = _.bind(obj[key], obj);
        }
        return obj;
    };

    // Memoize an expensive function by storing its results.
    // ���仯
    _.memoize = function(func, hasher) {
        var memoize = function(key) {
            var cache = memoize.cache;
            var address = '' + (hasher ? hasher.apply(this, arguments) : key);
            if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
            return cache[address];
        };
        memoize.cache = {};
        return memoize;
    };

    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    // �ӳٴ���ĳ����
    // _.delay(function, wait, *arguments)
    //  ��������� arguments ��������ᱻ���� function �Ĳ����ڴ���ʱ����
    _.delay = function(func, wait) {
        // ��ȡ *arguments
        // �� func ��������Ҫ�Ĳ���
        var args = slice.call(arguments, 2);
        return setTimeout(function(){
            // ���������� func ����
            return func.apply(null, args);
        }, wait);
    };

    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    // �� setTimeout(func, 0) ����
    _.defer = _.partial(_.delay, _, 1);

    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time. Normally, the throttled function will run
    // as much as it can, without ever going more than once per `wait` duration;
    // but if you'd like to disable the execution on the leading edge, pass
    // `{leading: false}`. To disable execution on the trailing edge, ditto.
    // ��������������������¼���Ӧ����ÿ���һ��ʱ��δ�����
    // ÿ��� wait(Number) milliseconds ����һ�� func ����
    // ��� options �������� {leading: false}
    // ��ô�������ϴ������ȴ� wait milliseconds ���һ�δ��� func��
    // ��� options �������� {trailing: false}
    // ��ô���һ�λص����ᱻ����
    // **Notice: options ����ͬʱ���� leading �� trailing Ϊ false**
    // ʾ����
    // var throttled = _.throttle(updatePosition, 100);
    // $(window).scroll(throttled);
    // ���÷�ʽ��ע�⿴ A �� B console.log ��ӡ��λ�ã���
    // _.throttle(function, wait, [options])
    // sample 1: _.throttle(function(){}, 1000)
    // print: A, B, B, B ...
    // sample 2: _.throttle(function(){}, 1000, {leading: false})
    // print: B, B, B, B ...
    // sample 3: _.throttle(function(){}, 1000, {trailing: false})
    // print: A, A, A, A ...
    // ----------------------------------------- //
    _.throttle = function(func, wait, options) {
        var context, args, result;

        // setTimeout �� handler
        var timeout = null;

        // ���ʱ���
        // ��һ��ִ�лص���ʱ���
        var previous = 0;

        // ���û�д��� options ����
        // �� options ������Ϊ�ն���
        if (!options)
            options = {};

        var later = function() {
            // ��� options.leading === false
            // ��ÿ�δ����ص��� previous ��Ϊ 0
            // ������Ϊ��ǰʱ���
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            // console.log('B')
            result = func.apply(context, args);

            // ����� timeout ����һ���� null �˰�
            // �Ƿ�û�б�Ҫ�����жϣ�
            if (!timeout)
                context = args = null;
        };

        // �Թ����¼�Ϊ����scroll��
        // ÿ�δ��������¼���ִ��������صķ���
        // _.throttle �������صĺ���
        return function() {
            // ��¼��ǰʱ���
            var now = _.now();

            // ��һ��ִ�лص�����ʱ previous Ϊ 0��֮�� previous ֵΪ��һ��ʱ�����
            // ������������趨��һ���ص���������ִ�еģ�options.leading === false��
            // �� previous ֵ����ʾ�ϴ�ִ�е�ʱ�������Ϊ now ��ʱ�������һ�δ���ʱ��
            // ��ʾ��ִ�й�����ξͲ���ִ����
            if (!previous && options.leading === false)
                previous = now;

            // �����´δ��� func ����Ҫ�ȴ���ʱ��
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;

            // Ҫô�ǵ��˼��ʱ���ˣ��漴����������remaining <= 0��
            // Ҫô��û�д��� {leading: false}���ҵ�һ�δ����ص�������������
            // ��ʱ previous Ϊ 0��wait - (now - previous) Ҳ���� <= 0
            // ֮����� previous ֵѸ����Ϊ now
            // ========= //
            // remaining > wait����ʾ�ͻ���ϵͳʱ�䱻������
            // ������ִ�� func ����
            // @see https://blog.coding.net/blog/the-difference-between-throttle-and-debounce-in-underscorejs
            // ========= //

            // console.log(remaining) ���Դ�ӡ��������
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    // ������ã���ֹ�ڴ�й¶
                    timeout = null;
                }

                // ����ǰһ�δ�����ʱ���
                previous = now;

                // ��������
                // result Ϊ�÷�������ֵ
                // console.log('A')
                result = func.apply(context, args);

                // ������Ϊ�գ���ֹ�ڴ�й¶
                // �о������ timeout �϶��� null ������� if �ж�û��Ҫ�ɣ�
                if (!timeout)
                    context = args = null;
            } else if (!timeout && options.trailing !== false) { // ���һ����Ҫ���������
                // ����Ѿ�����һ����ʱ�����򲻻����� if ��֧
                // ��� {trailing: false}�������һ�β���Ҫ�����ˣ�Ҳ������������֧
                // ��� remaining milliseconds �󴥷� later ����
                timeout = setTimeout(later, remaining);
            }

            // �ص�����ֵ
            return result;
        };
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    // ����ȥ���������¼�����������ֻ����һ�Σ�
    // sample 1: _.debounce(function(){}, 1000)
    // �����¼�������� 1000ms �󴥷�
    // sample 1: _.debounce(function(){}, 1000, true)
    // �����¼�������������������ʱ����Եڶ���������
    _.debounce = function(func, wait, immediate) {
        var timeout, args, context, timestamp, result;

        var later = function() {
            // ��ʱ�����õĻص� later �����Ĵ���ʱ�䣬�������¼����������һ��ʱ����ļ��
            // ������Ϊ wait�����߸պô��� wait�����򴥷��¼�
            var last = _.now() - timestamp;

            // ʱ���� last �� [0, wait) ��
            // ��û�������ĵ㣬��������ö�ʱ��
            // last ֵӦ�ò���С�� 0 �ɣ�
            if (last < wait && last >= 0) {
                timeout = setTimeout(later, wait - last);
            } else {
                // ���˿��Դ�����ʱ���
                timeout = null;
                // ���Դ�����
                // ���Ҳ�������Ϊ����������
                // ��Ϊ���������������callNow����Ҳ���������ص���
                // ��Ҫ��Ϊ�˽� timeout ֵ��Ϊ�գ�ʹ֮��Ӱ���´������¼��Ĵ���
                // �����������ִ�У��漴ִ�� func ����
                if (!immediate) {
                    // ִ�� func ����
                    result = func.apply(context, args);
                    // ����� timeout һ���� null �˰�
                    // �о�����ж϶�����
                    if (!timeout)
                        context = args = null;
                }
            }
        };

        // �ţ��հ����صĺ������ǿ��Դ��������
        // Ҳ�� DOM �¼��������Ļص�����
        return function() {
            // ����ָ�� this ָ��
            context = this;
            args = arguments;

            // ÿ�δ�������������ʱ���
            // later ������ȡ last ֵʱ�õ��ñ���
            // �жϾ����ϴδ����¼��Ƿ��Ѿ����� wait seconds ��
            // ��������Ҫ�������һ���¼����� wait seconds �󴥷�����ص�����
            timestamp = _.now();

            // ����������Ҫ������������
            // immediate ����Ϊ true������ timeout ��û����
            // immediate ����Ϊ true ���Զ��׼���
            // ���ȥ�� !timeout ���������ͻ�һֱ�����������Ǵ���һ��
            // ��Ϊ��һ�δ������Ѿ������� timeout�����Ը��� timeout �Ƿ�Ϊ�տ����ж��Ƿ����״δ���
            var callNow = immediate && !timeout;

            // ���� wait seconds �󴥷� later ����
            // �����Ƿ� callNow������� callNow��Ҳ���� later ������ȥ later �������ж��Ƿ�ִ����Ӧ�ص�������
            // ��ĳһ�ε����������У�ֻ���ڵ�һ�δ���ʱ������� if ��֧��
            if (!timeout)
            // ������ timeout�������Ժ󲻻������� if ��֧��
                timeout = setTimeout(later, wait);

            // �������������
            if (callNow) {
                // func �������з���ֵ��
                result = func.apply(context, args);
                // �������
                context = args = null;
            }

            return result;
        };
    };

    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function(func, wrapper) {
        return _.partial(wrapper, func);
    };

    // Returns a negated version of the passed-in predicate.
    // ����һ�� predicate �����Ķ�������
    // ���÷������Զ�ԭ���� predicate �������ֵȡ��
    _.negate = function(predicate) {
        return function() {
            return !predicate.apply(this, arguments);
        };
    };

    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    // _.compose(*functions)
    // _compose(f, g, h) => f(g(h()))
    _.compose = function() {
        var args = arguments;
        var start = args.length - 1;
        return function() {
            var i = start;
            var result = args[start].apply(this, arguments);
            while (i--) result = args[i].call(this, result);
            return result;
        };
    };

    // Returns a function that will only be executed on and after the Nth call.
    // һ���������ڵ� N �α�����ʱִ��
    // ��ʲô���أ�
    // ����� N ���첽�¼��������첽ִ�����ִ�иûص�
    // ˼�� eventproxy
    _.after = function(times, func) {
        return function() {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };

    // Returns a function that will only be executed up to (but not including) the Nth call.
    // ������ú��� times ��
    // ���� times �ε��õ�ʱ�򣬽� func ����ֵ����
    _.before = function(times, func) {
        var memo;
        return function() {
            if (--times > 0) {
                memo = func.apply(this, arguments);
            }
            if (times <= 1) func = null;
            return memo;
        };
    };

    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    // ��������ֻ�ܱ�����һ��
    // �����������ĳ�����ĳЩ����ֻ�ܱ���ʼ��һ�Σ����ò�����һ������ flag
    // ��ʼ�������� flag Ϊ true��֮�󲻶� check flag
    _.once = _.partial(_.before, 2);


    // Object Functions
    // �������չ����
    // �� 38 ����չ����
    // ----------------

    // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
    // IE < 9 �� ������ for key in ... ��ö�ٶ����ĳЩ key
    // ������д�˶���� `toString` ��������� key ֵ�Ͳ����� IE < 9 ���� for in ö�ٵ�
    // IE < 9��{toString: null}.propertyIsEnumerable('toString') ���� false
    // IE < 9����д�� `toString` ���Ա���Ϊ����ö��
    // �ݴ˿����ж��Ƿ��� IE < 9 �����������
    var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');

    // IE < 9 �²����� for in ��ö�ٵ� key ֵ����
    // ��ʵ���и� `constructor` ����
    // ���˾��ÿ����� `constructor` ���������Բ�����һ��
    // nonEnumerableProps[] �ж��Ƿ���
    // �� constructor ��ʾ���Ƕ���Ĺ��캯��
    // �������ֿ�����
    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
        'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

    // obj Ϊ��Ҫ������ֵ�ԵĶ���
    // keys Ϊ������
    // ���� JavaScript ��ֵ���ݵ��ص�
    // ����������Ϊ��������ֱ�Ӹı������ֵ
    function collectNonEnumProps(obj, keys) {
        var nonEnumIdx = nonEnumerableProps.length;
        var constructor = obj.constructor;

        // ��ȡ�����ԭ��
        // ��� obj �� constructor ����д
        // �� proto ����Ϊ Object.prototype
        // ���û�б���д
        // ��Ϊ obj.constructor.prototype
        var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

        // Constructor is a special case.
        // `constructor` ������Ҫ���⴦�� (�Ƿ��б�Ҫ��)
        // see https://github.com/hanzichi/underscore-analysis/issues/3
        // ��� obj �� `constructor` ��� key
        // ���Ҹ� key û���� keys ������
        // ���� keys ����
        var prop = 'constructor';
        if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

        // ���� nonEnumerableProps �����е� keys
        while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];
            // prop in obj Ӧ�ÿ϶����� true �ɣ��Ƿ����жϱ�Ҫ��
            // obj[prop] !== proto[prop] �жϸ� key �Ƿ�������ԭ����
            // ���Ƿ���д��ԭ�����ϵ�����
            if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
                keys.push(prop);
            }
        }
    }

    // Retrieve the names of an object's own properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    // ===== //
    // _.keys({one: 1, two: 2, three: 3});
    // => ["one", "two", "three"]
    // ===== //
    // ����һ������� keys ��ɵ�����
    // ������ own enumerable properties ��ɵ�����
    _.keys = function(obj) {
        // �ݴ�
        // �������Ĳ������Ƕ����򷵻ؿ�����
        if (!_.isObject(obj)) return [];

        // ��������֧�� ES5 Object.key() ����
        // ������ʹ�ø÷���
        if (nativeKeys) return nativeKeys(obj);

        var keys = [];

        // own enumerable properties
        for (var key in obj)
            // hasOwnProperty
            if (_.has(obj, key)) keys.push(key);

        // Ahem, IE < 9.
        // IE < 9 �²����� for in ��ö��ĳЩ key ֵ
        // ���� keys ����Ϊ����
        // ��Ϊ JavaScript �º���������ֵ����
        // ���� keys ���������������� `collectNonEnumProps` �����иı�ֵ
        if (hasEnumBug) collectNonEnumProps(obj, keys);

        return keys;
    };

    // Retrieve all the property names of an object.
    // ����һ������� keys ����
    // �������� own enumerable properties
    // ������ԭ�����ϼ̳е�����
    _.allKeys = function(obj) {
        // �ݴ�
        // ���Ƕ����򷵻ؿ�����
        if (!_.isObject(obj)) return [];

        var keys = [];
        for (var key in obj) keys.push(key);

        // Ahem, IE < 9.
        // IE < 9 �µ� bug��ͬ _.keys ����
        if (hasEnumBug) collectNonEnumProps(obj, keys);

        return keys;
    };

    // Retrieve the values of an object's properties.
    // ===== //
    // _.values({one: 1, two: 2, three: 3});
    // => [1, 2, 3]
    // ===== //
    // ��һ����������� values ֵ����������
    // ���� own properties �ϵ� values
    // ������ԭ�����ϵ�
    // �����ظ�����
    _.values = function(obj) {
        // ������ own properties
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    };

    // Returns the results of applying the iteratee to each element of the object
    // In contrast to _.map it returns an object
    // �� _.map ��������
    // ������ר��Ϊ�������� map ����
    // ���������ı����� values ֵ
    // ���ض��󸱱�
    _.mapObject = function(obj, iteratee, context) {
        // ��������
        // ��ÿ����ֵ�Խ��е���
        iteratee = cb(iteratee, context);

        var keys =  _.keys(obj),
            length = keys.length,
            results = {}, // ���󸱱����÷������صĶ���
            currentKey;

        for (var index = 0; index < length; index++) {
            currentKey = keys[index];
            // key ֵ����
            // ��ÿ�� value ֵ�õ�����������
            // ���ؾ�������������ֵ
            results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    // Convert an object into a list of `[key, value]` pairs.
    // ��һ������ת��ΪԪ��Ϊ [key, value] ��ʽ������
    // _.pairs({one: 1, two: 2, three: 3});
    // => [["one", 1], ["two", 2], ["three", 3]]
    _.pairs = function(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var pairs = Array(length);
        for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
        }
        return pairs;
    };

    // Invert the keys and values of an object. The values must be serializable.
    // ��һ������� key-value ��ֵ�Եߵ�
    // ��ԭ���� key Ϊ value ֵ��ԭ���� value ֵΪ key ֵ
    // ��Ҫע����ǣ�value ֵ�����ظ�����Ȼ����ĻḲ��ǰ��ģ�
    // ���¹���Ķ�����϶��������
    // ���ҷ����¹���Ķ���
    _.invert = function(obj) {
        // ���ص��µĶ���
        var result = {};
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    };

    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`
    // ����һ������
    // �����ö���ļ�ֵ�ԣ����� own properties �Լ� ԭ�����ϵģ�
    // ���ĳ�� value �������Ƿ�����function�����򽫸� key ��������
    // ������������󷵻�
    _.functions = _.methods = function(obj) {
        // ���ص�����
        var names = [];

        // if IE < 9
        // �Ҷ�����д�� `nonEnumerableProps` �����е�ĳЩ����
        // ��ô��Щ�������ǲ��ᱻ���ص�
        // �ɼ������� IE < 9 ���ܶ� `toString` �ȷ�������д֧��
        for (var key in obj) {
            // ���ĳ�� key ��Ӧ�� value ֵ�����Ǻ���
            // ����� key ֵ��������
            if (_.isFunction(obj[key])) names.push(key);
        }

        // ��������������
        return names.sort();
    };

    // Extend a given object with all the properties in passed-in object(s).
    // extend_.extend(destination, *sources)
    // Copy all of the properties in the source objects over to the destination object
    // and return the destination object
    // It's in-order, so the last source will override properties of the same name in previous arguments.
    // �����������ϣ��ڶ���������ʼ�����ݲ��������������м�ֵ����ӵ� destination ���󣨵�һ����������
    // ��Ϊ key ֵ���ܻ���ͬ�����Ժ���ģ���ֵ�ԣ����ܻḲ��ǰ���
    // �������� >= 1
    _.extend = createAssigner(_.allKeys);

    // Assigns a given object with all the own properties in the passed-in object(s)
    // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
    // �� extend �������ƣ�����ֻ�� own properties ��������һ����������
    // ֻ�̳� own properties �ļ�ֵ��
    // �������� >= 1
    _.extendOwn = _.assign = createAssigner(_.keys);

    // Returns the first key on an object that passes a predicate test
    // �����鷽���� _.findIndex ����
    // �ҵ�����ļ�ֵ���е�һ�����������ļ�ֵ��
    // �����ظü�ֵ�� key ֵ
    _.findKey = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = _.keys(obj), key;
        // ������ֵ��
        for (var i = 0, length = keys.length; i < length; i++) {
            key = keys[i];
            // ����������ֱ�ӷ��� key ֵ
            if (predicate(obj[key], key, obj)) return key;
        }
    };

    // Return a copy of the object only containing the whitelisted properties.
    // ����һ��������key ֵ������ͨ�� predicate ����������٣�
    // ����ӵ��һ����ֵ�ԵĶ��󸱱�
    // �ڶ�������������һ�� predicate ����
    // Ҳ������ >= 0 �� key
    // _.pick(object, *keys)
    // Return a copy of the object
    // filtered to only have values for the whitelisted keys (or array of valid keys)
    // Alternatively accepts a predicate indicating which keys to pick.
    /*
     _.pick({name: 'moe', age: 50, userid: 'moe1'}, 'name', 'age');
     => {name: 'moe', age: 50}
     _.pick({name: 'moe', age: 50, userid: 'moe1'}, ['name', 'age']);
     => {name: 'moe', age: 50}
     _.pick({name: 'moe', age: 50, userid: 'moe1'}, function(value, key, object) {
     return _.isNumber(value);
     });
     => {age: 50}
     */
    _.pick = function(object, oiteratee, context) {
        // result Ϊ���صĶ��󸱱�
        var result = {}, obj = object, iteratee, keys;

        // �ݴ�
        if (obj == null) return result;

        // ����ڶ��������Ǻ���
        if (_.isFunction(oiteratee)) {
            keys = _.allKeys(obj);
            iteratee = optimizeCb(oiteratee, context);
        } else {
            // ����ڶ����������Ǻ���
            // ������ keys ����������
            // Ҳ�����������ļ������еĲ���
            // �� flatten ������չ��
            keys = flatten(arguments, false, false, 1);

            // ҲתΪ predicate �����ж���ʽ
            // ��ָ�� key ת��Ϊ predicate ����
            iteratee = function(value, key, obj) { return key in obj; };
            obj = Object(obj);
        }

        for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i];
            var value = obj[key];
            // ��������
            if (iteratee(value, key, obj)) result[key] = value;
        }
        return result;
    };

    // Return a copy of the object without the blacklisted properties.
    // �� _.pick �������
    // ���� _.pick �Ĳ���
    // ������û��ָ�� keys ֵ�Ķ��󸱱�
    // ���߷��ز���ͨ�� predicate �����Ķ��󸱱�
    _.omit = function(obj, iteratee, context) {
        if (_.isFunction(iteratee)) {
            // _.negate ������ iteratee �Ľ��ȡ��
            iteratee = _.negate(iteratee);
        } else {
            var keys = _.map(flatten(arguments, false, false, 1), String);
            iteratee = function(value, key) {
                return !_.contains(keys, key);
            };
        }
        return _.pick(obj, iteratee, context);
    };

    // _.defaults(object, *defaults)
    // Fill in a given object with default properties.
    // Fill in undefined properties in object
    // with the first value present in the following list of defaults objects.
    // �� _.extend �ǳ�����
    // ��������� *defaults �г����˺� object ��һ���ļ�
    // �򲻸��� object �ļ�ֵ��
    // ��� *defaults �����������������ͬ key �Ķ���
    // ��ȡ������ֵ� value ֵ
    // �������� >= 1
    _.defaults = createAssigner(_.allKeys, true);

    // Creates an object that inherits from the given prototype object.
    // If additional properties are provided then they will be added to the
    // created object.
    // ���� prototype
    // �Լ�һЩ own properties
    // ����һ���µĶ��󲢷���
    _.create = function(prototype, props) {
        var result = baseCreate(prototype);

        // �� props �ļ�ֵ�Ը��� result ����
        if (props) _.extendOwn(result, props);
        return result;
    };

    // Create a (shallow-cloned) duplicate of an object.
    // ����� `ǳ����` ����
    // ע��㣺����Ƕ�׵Ķ���������鶼���ԭ������ͬһ������
    // ������Ϊǳ���ƣ���������ȿ�¡
    _.clone = function(obj) {
        // �ݴ�������Ƕ�������������ͣ������ֱ�ӷ���
        // ��ΪһЩ����������ֱ�Ӱ�ֵ���ݵ�
        // ˼����arguments �أ� Nodelists �أ� HTML Collections �أ�
        if (!_.isObject(obj)) return obj;

        // ��������飬���� obj.slice() �������鸱��
        // ����Ƕ�������ȡ���� obj �ļ�ֵ�Ը��ǿն��󣬷���
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    // _.chain([1,2,3,200])
    // .filter(function(num) { return num % 2 == 0; })
    // .tap(alert)
    // .map(function(num) { return num * num })
    // .value();
    // => // [2, 200] (alerted)
    // => [4, 40000]
    // ��Ҫ��������ʽ������
    // ���м�ֵ�������д���
    _.tap = function(obj, interceptor) {
        interceptor(obj);
        return obj;
    };

    // Returns whether an object has a given set of `key:value` pairs.
    // attrs ����Ϊһ������
    // �ж� object �������Ƿ��� attrs �е����� key-value ��ֵ��
    // ���ز���ֵ
    _.isMatch = function(object, attrs) {
        // ��ȡ attrs ��������� keys
        var keys = _.keys(attrs), length = keys.length;

        // ��� object Ϊ��
        // ���� attrs �ļ�ֵ���������ز���ֵ
        if (object == null) return !length;

        // ��һ���б�Ҫ��
        var obj = Object(object);

        // ���� attrs �����ֵ��
        for (var i = 0; i < length; i++) {
            var key = keys[i];

            // ��� obj ����û�� attrs �����ĳ�� key
            // ���߶���ĳ�� key�����ǵ� value ֵ��ͬ
            // ��֤�� object ����ӵ�� attrs �����м�ֵ��
            // �򷵻� false
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }

        return true;
    };


    // Internal recursive comparison function for `isEqual`.
    // "�ڲ���"/ "�ݹ��"/ "�Ƚ�"
    // ���ڲ������ᱻ�ݹ����
    var eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        // a === b ʱ
        // ��Ҫע�� `0 === -0` ��� special case
        // 0 �� -0 ����Ϊ����ͬ��unequal��
        // ����ԭ����Բο����������
        if (a === b) return a !== 0 || 1 / a === 1 / b;

        // A strict comparison is necessary because `null == undefined`.
        // ��� a �� b ��һ��Ϊ null������ undefined��
        // �ж� a === b
        if (a == null || b == null) return a === b;

        // Unwrap any wrapped objects.
        // ��� a �� b �� underscore OOP �Ķ���
        // ��ô�Ƚ� _wrapped ����ֵ��Unwrap��
        if (a instanceof _) a = a._wrapped;
        if (b instanceof _) b = b._wrapped;

        // Compare `[[Class]]` names.
        // �� Object.prototype.toString.call ������ȡ a ��������
        var className = toString.call(a);

        // ��� a �� b ���Ͳ���ͬ���򷵻� false
        // ���Ͷ���ͬ�˻��Ƚϸ�����
        if (className !== toString.call(b)) return false;

        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            // �����������͵�Ԫ�ؿ���ֱ�Ӹ����� value ֵ���Ƚ��Ƿ����
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                // תΪ String ���ͽ��бȽ�
                return '' + a === '' + b;

            // RegExp �� String ���Կ���һ��
            // ��� obj Ϊ RegExp ���� String ����
            // ��ô '' + obj �Ὣ obj ǿ��תΪ String
            // ���� '' + a === '' + b �����ж� a �� b �Ƿ����
            // ================

            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN
                // ��� +a !== +a
                // ��ô a ���� NaN
                // �ж� b �Ƿ�Ҳ�� NaN ����
                if (+a !== +a) return +b !== +b;

                // An `egal` comparison is performed for other numeric values.
                // �ų��� NaN ����
                // ��Ҫ���� 0 �ĸ���
                // �� +a �� Number() ��ʽתΪ��������
                // �� +Number(1) ==> 1
                // 0 ��Ҫ����
                // ��� a Ϊ 0���ж� 1 / +a === 1 / b
                // �����ж� +a === +b
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;

            // ��� a Ϊ Number ����
            // Ҫע�� NaN ��� special number
            // NaN �� NaN ����Ϊ equal
            // ================

            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;

            // Date �� Boolean ���Կ���һ��
            // ��� obj Ϊ Date ���� Boolean
            // ��ô +obj �Ὣ obj תΪ Number ����
            // Ȼ��Ƚϼ���
            // +new Date() �ǵ�ǰʱ����� 1970 �� 1 �� 1 �� 0 ��ĺ�����
            // +true => 1
            // +new Boolean(false) => 0
        }


        // �ж� a �Ƿ�������
        var areArrays = className === '[object Array]';

        // ��� a ������������
        if (!areArrays) {
            // ��� a ���� object ���� b ���� object
            // �򷵻� false
            if (typeof a != 'object' || typeof b != 'object') return false;

            // ͨ���ϸ������ if ����
            // !!��֤���˵� a �� b ��Ϊ����!!

            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            // ͨ�����캯�����ж� a �� b �Ƿ���ͬ
            // ���ǣ���� a �� b �Ĺ��캯����ͬ
            // Ҳ����һ�� a �� b ���� unequal
            // ���� a �� b �ڲ�ͬ�� iframes �У�
            // aCtor instanceof aCtor �ⲽ�е㲻����⣬ɶ�ã�
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                _.isFunction(bCtor) && bCtor instanceof bCtor)
                && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }

        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        // ��һ�ε��� eq() ������û�д��� aStack �� bStack ����
        // ֮��ݹ���ö��ᴫ������������
        aStack = aStack || [];
        bStack = bStack || [];

        var length = aStack.length;

        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        // ��Ƕ�׵Ķ��������չ��
        // ��� a ������
        // ��ΪǶ�ף�������Ҫչ����ȱȽ�
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            // ���� length �ж��Ƿ�Ӧ�ü����ݹ�Ա�
            length = a.length;

            // ��� a �� b length ���Դ�С��ͬ
            // ��ô��Ȼ a �� b ��ͬ
            // return false ���ü����Ƚ���
            if (length !== b.length) return false;

            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
                // �ݹ�
                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            // ��� a ��������
            // ��������жϷ�֧

            // Deep compare objects.
            // �����������ȱȽ�
            var keys = _.keys(a), key;
            length = keys.length;

            // Ensure that both objects contain the same number of properties before comparing deep equality.
            // a �� b ����ļ�������ͬ
            // �ǻ��Ƚ�ë��
            if (_.keys(b).length !== length) return false;

            while (length--) {
                // Deep compare each member
                // �ݹ�Ƚ�
                key = keys[length];
                if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }

        // Remove the first object from the stack of traversed objects.
        // �� aStack.push(a) ��Ӧ
        // ��ʱ aStack ջ��Ԫ������ a
        // �������ߵ��˲�
        // a �� b isEqual ȷ��
        // ���� a��b ����Ԫ�ؿ��Գ�ջ
        aStack.pop();
        bStack.pop();

        // ��������ݹ�Ƚ����
        // ���ĵ� return true
        return true;
    };

    // Perform a deep comparison to check if two objects are equal.
    // �ж����������Ƿ�һ��
    // new Boolean(true)��true ����Ϊ equal
    // [1, 2, 3], [1, 2, 3] ����Ϊ equal
    // 0 �� -0 ����Ϊ unequal
    // NaN �� NaN ����Ϊ equal
    _.isEqual = function(a, b) {
        return eq(a, b);
    };

    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    // �Ƿ��� {}��[] ���� "" ���� null��undefined
    _.isEmpty = function(obj) {
        if (obj == null) return true;

        // ��������顢�����顢�����ַ���
        // ���� length �����ж��Ƿ�Ϊ��
        // �����������Ϊ�˹��� isArrayLike ���� {length: 10} ����������ж� bug��
        if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;

        // ����Ƕ���
        // ���� keys �����ж��Ƿ�Ϊ Empty
        return _.keys(obj).length === 0;
    };


    // Is a given value a DOM element?
    // �ж��Ƿ�Ϊ DOM Ԫ��
    _.isElement = function(obj) {
        // ȷ�� obj ���� null, undefined �ȼ�ֵ
        // ���� obj.nodeType === 1
        return !!(obj && obj.nodeType === 1);
    };

    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    // �ж��Ƿ�Ϊ����
    _.isArray = nativeIsArray || function(obj) {
            return toString.call(obj) === '[object Array]';
        };

    // Is a given variable an object?
    // �ж��Ƿ�Ϊ����
    // ����Ķ������ function �� object
    _.isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
    // ���������ж�
    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
        _['is' + name] = function(obj) {
            return toString.call(obj) === '[object ' + name + ']';
        };
    });

    // Define a fallback version of the method in browsers (ahem, IE < 9), where
    // there isn't any inspectable "Arguments" type.
    // _.isArguments ������ IE < 9 �µļ���
    // IE < 9 �¶� arguments ���� Object.prototype.toString.call ����
    // ����� => [object Object]
    // ���������������� [object Arguments]��
    // so ���Ƿ��� callee ������������
    if (!_.isArguments(arguments)) {
        _.isArguments = function(obj) {
            return _.has(obj, 'callee');
        };
    }

    // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
    // IE 11 (#1621), and in Safari 8 (#1929).
    // _.isFunction �� old v8, IE 11 �� Safari 8 �µļ���
    // ���������е�����
    // ���õ� chrome 49 (��Ȼ���� old v8)
    // ȴҲ��������� if �ж��ڲ�
    if (typeof /./ != 'function' && typeof Int8Array != 'object') {
        _.isFunction = function(obj) {
            return typeof obj == 'function' || false;
        };
    }

    // Is a given object a finite number?
    // �ж��Ƿ������޵�����
    _.isFinite = function(obj) {
        return isFinite(obj) && !isNaN(parseFloat(obj));
    };

    // Is the given value `NaN`? (NaN is the only number which does not equal itself).
    // �ж��Ƿ��� NaN
    // NaN ��Ψһ��һ�� `�Լ��������Լ�` �� number ����
    // ����д�� BUG
    // _.isNaN(new Number(0)) => true
    // ��� https://github.com/hanzichi/underscore-analysis/issues/13
    // ���°汾��edge �棩�Ѿ��޸��� BUG
    _.isNaN = function(obj) {
        return _.isNumber(obj) && obj !== +obj;
    };

    // Is a given value a boolean?
    // �ж��Ƿ��ǲ���ֵ
    // �������ͣ�true�� false��
    // �Լ� new Boolean() ���������ж�
    // �е�����˰ɣ�
    // ���˾���ֱ���� toString.call(obj) ���жϾͿ�����
    _.isBoolean = function(obj) {
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    // Is a given value equal to null?
    // �ж��Ƿ��� null
    _.isNull = function(obj) {
        return obj === null;
    };

    // Is a given variable undefined?
    // �ж��Ƿ��� undefined
    // undefined �ܱ���д ��IE < 9��
    // undefined ֻ��ȫ�ֶ����һ������
    // �ھֲ������ܱ����¶���
    // ���� void 0 ʼ���� undefined
    _.isUndefined = function(obj) {
        return obj === void 0;
    };

    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    // �ж϶������Ƿ���ָ�� key
    // own properties, not on a prototype
    _.has = function(obj, key) {
        // obj ����Ϊ null ���� undefined
        return obj != null && hasOwnProperty.call(obj, key);
    };

    // Utility Functions
    // �����෽��
    // �� 14 ����չ����
    // -----------------

    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    // ���ȫ�ֻ������Ѿ�ʹ���� `_` ����
    // �����ø÷���������������
    // ����ʹ�� underscore �еķ���
    // var us = _.noConflict();
    // us.each(..);
    _.noConflict = function() {
        root._ = previousUnderscore;
        return this;
    };

    // Keep the identity function around for default iteratees.
    // ���ش���Ĳ���
    // ����������ûʲô����
    // ��ʵ _.identity �� undescore �ڴ�����Ϊ������������
    // �ܼ򻯺ܶ������������д
    _.identity = function(value) {
        return value;
    };

    // Predicate-generating functions. Often useful outside of Underscore.
    _.constant = function(value) {
        return function() {
            return value;
        };
    };

    _.noop = function(){};

    // ������
    // var property = function(key) {
    //   return function(obj) {
    //     return obj == null ? void 0 : obj[key];
    //   };
    // };
    _.property = property;

    // Generates a function for a given object that returns a given property.
    _.propertyOf = function(obj) {
        return obj == null ? function(){} : function(key) {
            return obj[key];
        };
    };

    // Returns a predicate for checking whether an object has a given set of
    // `key:value` pairs.
    // �ж�һ�������Ķ����Ƿ���ĳЩ��ֵ��
    _.matcher = _.matches = function(attrs) {
        attrs = _.extendOwn({}, attrs);
        return function(obj) {
            return _.isMatch(obj, attrs);
        };
    };

    // Run a function **n** times.
    // ִ��ĳ���� n ��
    _.times = function(n, iteratee, context) {
        var accum = Array(Math.max(0, n));
        iteratee = optimizeCb(iteratee, context, 1);
        for (var i = 0; i < n; i++) accum[i] = iteratee(i);
        return accum;
    };

    // Return a random integer between min and max (inclusive).
    // ����һ�� [min, max] ��Χ�ڵ���������
    _.random = function(min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };

    // A (possibly faster) way to get the current timestamp as an integer.
    // ���ص�ǰʱ��� "ʱ���"
    // ��ʵ������ʱ�����ʱ�����Ҫ���� 1000
    _.now = Date.now || function() {
            return new Date().getTime();
        };

    // List of HTML entities for escaping.
    // HTML ʵ�����
    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
    };
    var unescapeMap = _.invert(escapeMap);

    // Functions for escaping and unescaping strings to/from HTML interpolation.
    var createEscaper = function(map) {
        var escaper = function(match) {
            return map[match];
        };
        // Regexes for identifying a key that needs to be escaped
        var source = '(?:' + _.keys(map).join('|') + ')';
        var testRegexp = RegExp(source);
        var replaceRegexp = RegExp(source, 'g');
        return function(string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
    };
    _.escape = createEscaper(escapeMap);
    _.unescape = createEscaper(unescapeMap);

    // If the value of the named `property` is a function then invoke it with the
    // `object` as context; otherwise, return it.
    _.result = function(object, property, fallback) {
        var value = object == null ? void 0 : object[property];
        if (value === void 0) {
            value = fallback;
        }
        return _.isFunction(value) ? value.call(object) : value;
    };

    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    var idCounter = 0;
    _.uniqueId = function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    };

    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
        evaluate    : /<%([\s\S]+?)%>/g,
        interpolate : /<%=([\s\S]+?)%>/g,
        escape      : /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
        "'":      "'",
        '\\':     '\\',
        '\r':     'r',
        '\n':     'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

    var escapeChar = function(match) {
        return '\\' + escapes[match];
    };

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    // NB: `oldSettings` only exists for backwards compatibility.
    // ��������ģ���������
    _.template = function(text, settings, oldSettings) {
        if (!settings && oldSettings) settings = oldSettings;
        settings = _.defaults({}, settings, _.templateSettings);

        // Combine delimiters into one regular expression via alternation.
        var matcher = RegExp([
                (settings.escape || noMatch).source,
                (settings.interpolate || noMatch).source,
                (settings.evaluate || noMatch).source
            ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, escapeChar);
            index = offset + match.length;

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            } else if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }

            // Adobe VMs need the match returned to produce the correct offest.
            return match;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + 'return __p;\n';

        try {
            var render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        var template = function(data) {
            return render.call(this, data, _);
        };

        // Provide the compiled source as a convenience for precompilation.
        var argument = settings.variable || 'obj';
        template.source = 'function(' + argument + '){\n' + source + '}';

        return template;
    };

    // Add a "chain" function. Start chaining a wrapped Underscore object.
    // ʹ֧����ʽ����
    _.chain = function(obj) {
        var instance = _(obj);
        instance._chain = true;
        return instance;
    };

    // OOP
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.

    // OOP
    // ��� `_` ���������������캯��������, �򷵻�һ������װ���Ķ���
    // �ö�����ʹ�� underscore �����з���
    // ����֧����ʽ����

    // Helper function to continue chaining intermediate results.
    var result = function(instance, obj) {
        return instance._chain ? _(obj).chain() : obj;
    };

    // Add your own custom functions to the Underscore object.

    // ���� underscore �����չ�Լ��ķ���
    // obj ����������һ������
    // ���Լ��ķ��������� obj ��������
    // �� obj.myFunc = function() {...}
    // ֮����ʹ������: _.myFunc(..) ���� OOP _(..).myFunc(..)
    _.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function() {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result(this, func.apply(_, args));
            };
        });
    };

    // Add all of the Underscore functions to the wrapper object.
    // ��ǰ�涨��� underscore ������Ӹ���װ���Ķ���
    // ����ӵ� _.prototype ��
    // ʹ underscore ֧�����������ʽ�ĵ���
    _.mixin(_);

    // Add all mutator Array functions to the wrapper.
    // �� Array ԭ�������еķ�������ӵ� underscore ��
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return result(this, obj);
        };
    });

    // Add all accessor Array functions to the wrapper.
    // ��� concat��join��slice ����
    _.each(['concat', 'join', 'slice'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            return result(this, method.apply(this._wrapped, arguments));
        };
    });

    // Extracts the result from a wrapped and chained object.
    // һ����װ��(OOP)������ʽ���õĶ���
    // �� value ������ȡ���
    _.prototype.value = function() {
        return this._wrapped;
    };

    // Provide unwrapping proxy for some methods used in engine operations
    // such as arithmetic and JSON stringification.
    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    _.prototype.toString = function() {
        return '' + this._wrapped;
    };

    // ���� AMD �淶
    if (typeof define === 'function' && define.amd) {
        define('underscore', [], function() {
            return _;
        });
    }
}.call(this));