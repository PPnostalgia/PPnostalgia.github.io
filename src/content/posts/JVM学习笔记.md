---
title: JVM学习笔记
categories: ['学习笔记']
pubDate: 2022-03-09 21:29:34
description: 'JVM学习的意义更多是培养一种思维，知道如何优化系统运行效率，排查系统占用高，响应慢的原因'
---

# 一、什么是JVM

## 定义

Java Virtual Machine，JAVA程序的**运行环境**（JAVA二进制字节码的运行环境）

## 好处

- 一次编写，到处运行
- 自动内存管理，垃圾回收功能
- 数组下标越界检查
- 多态

## 比较

![image-20220309213643124](https://s2.loli.net/2022/03/09/cDbHihPC4pUktgy.png)

- **JRE(Java Runtime Enviroment)**是Java的运行环境，提供给想运行java程序的用户使用的。
- **JDK(Java Development Kit)**又称J2SDK(Java2 Software Development Kit)，是Java开发工具包，提供给程序员使用的

## JVM学习路线

![image-20220309214910780](https://s2.loli.net/2022/03/09/GZE5krdufawKNvV.png)

内存结构->垃圾回收—>类字节码结构，编译器优化—>类加载器—>运行时优化，即时编译器



# 二、 程序计数器

Program Counter Register 程序计数器（寄存器）

作用：它可以看作**当前线程**所执行的字节码的行号指示器，**存储的下一条指令的执行地址**

![image-20220310090006233](https://s2.loli.net/2022/03/10/MC7hxtVYIv1nZ5L.png)

执行流程：

​	指令0执行交给解释器的同时将下一条指令的地址放入程序计数器中，指令0执行完后从程序计数器中取到下一条指令执行地址。



物理上是通过**CPU里的寄存器**实现的（因为需要频繁的存取指令地址，所以需要性能高）。

## 特点

1. 每个线程都需要有一个独立的程序计数器（线程私有），各条线程之间计数器互不影响，这类区域为**线程私有区域**

​	  当某个线程的时间片用完时等原因，发生**上下文切换**，将线程1切换到线程2，这时线程1的程序计数器（**私有**）记录了下一条指令的执行地址，当线程2执行完后，线程1抢到时间片，即可从程序计数器中取出并继续执行下一条指令

2. **不会存在内存溢出**（运行时数据区里唯一一块没有Out of Memory的区域）



# 三、虚拟机栈

数据结构：先进后出

## 定义

Java Virtual Machine Stacks （Java 虚拟机栈）

- 每个**线程**运行时所需要的**内存**，称为虚拟机栈

- 每个栈由多个**栈帧**（Frame）组成，对应着**每次方法调用时所占用的内存**

  每个方法从调用直至执行完成的过程，就对应着一个栈帧在虚拟机栈中入栈到出栈的过程（可通过debugger 查看frames中不同栈帧的调入调出过程）。栈帧存储：

  - 方法参数
  - 局部变量（基本数据类型、自定义对象的引用）
  - 操作数栈
  - 返回地址

- 每个线程只能有一个活动栈帧，对应着当前**正在执行**的那个方法（栈顶部）



## 问题

1. 垃圾回收是否涉及栈内存？

​		不会，栈帧内存在方法每一次执行完后会自动弹出栈，释放内存，垃圾回收只会涉及堆内存中的无用对象

2. 栈内存分配越大越好吗？

​		不会，物理内存一定，线程运行内存变大，会让线程数变少。

3. 方法内的局部变量是否线程安全？

​		如果方法内局部变量没有逃离方法的作用访问，它是线程安全的

​				每个线程调用同一个方法时，各自生成了一个栈帧压入不同栈中，栈帧中的局部变量私有

​		如果是**局部变量引用了对象，并逃离方法的作用范围**（如static,static变量也称作静态变量，静态变量和非静态变量的区别是：**静态变量被所有的对象所共享，在内存中只有一个副本**，它当且仅当在类初次加载时会被初始化。而非静态变量是对象所拥有的，在创建对象的时候被初始化，存在多个副本，各个对象拥有的副本互不影响。），需要考虑线程安全

```java
//线程安全
    public static void m1(){
        StringBuilder sb = new StringBuilder();
        sb.append(1);
        System.out.println(sb.toString());
    }
    //若sb作为方法参数传入进来，代表有可能有其他线程访问到，可能是共享的，不是线程安全
    public static void m2(StringBuilder sb){
        sb.append(1);
        System.out.println(sb.toString());
    }
    //作为返回结果返回，其他线程有可能拿到这个对象的引用，进行并发修改
    public static StringBuilder m3(){
        StringBuilder sb = new StringBuilder();
        sb.append(1);
        return sb;
    }
```



## 栈内存溢出

**java.lang.StackOverflowError**

场景：

- **栈帧过多导致栈内存溢出**      常见：递归
- **栈帧过大导致栈内存溢出**    （力扣里的运行超时，是否可能是根据题目要求空间大小，设置了线程内存大小，而方法占用内存过大）

ps:

内存泄漏：指程序中己动态分配的堆内存由于某种原因程序未释放或无法释放，造成系统内存的浪费，导致程序运行速度减慢甚至系统崩溃等严重后果

## 线程运行诊断

案例1： cpu 占用过多

定位：

1. 用top定位哪个进程对cpu的占用过高

2. ps H -eo pid,tid,%cpu | grep 进程id （用ps命令进一步定位是**哪个线程引起的cpu占用过高**）

3. jstack（jdk的命令） 进程id

可以根据线程id 找到有问题的线程，进一步定位到问题代码的源码行号

案例2：程序运行很长时间没有结果

## 本地方法栈

本地方法：不是由java代码编写的方法

![image-20220310102650460](https://s2.loli.net/2022/03/10/iRmFC5Zx1GDNzV4.png)



# 四、堆

## 4.1 定义

Heap 堆 通过 new 关键字，创建对象都会使用堆内存 

- 特点

  - 它是**线程共享**的，堆中对象都需要考虑线程安全的问题 

  - 有垃圾回收机制

## 4.2 堆内存溢出

**java.lang.OutOfMemoryError** 

垃圾回收机制会将不再需要的对象进行回收，但是如果一直生成需要的对象，则会导致堆内存溢出。

![image-20220321163600000](https://s2.loli.net/2022/03/21/MB9FrqGD6I73Znk.png)

## 4.3 堆内存诊断

1. jps 工具 

   查看当前系统中有哪些 java 进程

2.  jmap 工具 

   查看堆内存占用情况 jmap - heap 进程id （只能查询某一时刻）

3. jconsole工具 

   图形界面的，多功能的监测工具，可以连续监测



## 4.4 面试题

Java中的对象都是在堆上分配的吗？

**Java中的对象不一定是在堆上分配的，因为JVM通过逃逸分析，能够分析出一个新对象的使用范围，并以此确定是否要将这个对象分配到堆上。**

逃逸分析就是：一种确定指针动态范围的静态分析，它可以分析在程序的哪些地方可以访问到指针。

### 示例

​	**一种典型的对象逃逸就是：对象被复制给成员变量或者静态变量，可能被外部使用，此时变量就发生了逃逸。**

​	**另一种典型的场景就是：对象通过return语句返回。如果对象通过return语句返回了，此时的程序并不能确定这个对象后续会不会被使用，外部的线程可以访问到这个变量，此时对象也发生了逃逸。**



### 逃逸分析

逃逸分析的优点总体上来说可以分为三个：对象可能分配在栈上、分离对象或标量替换、消除同步锁。我们可以使用下图来表示。

![img](https://s2.loli.net/2022/03/21/aMBECweOxUID2SJ.jpg)

**对象可能分配在栈上**

JVM通过逃逸分析，分析出新对象的使用范围，就可能将对象**在栈上进行分配**。栈分配可以快速地在栈帧上创建和销毁对象，不用再将对象分配到堆空间，可以有效地减少 JVM 垃圾回收的压力。

**分离对象或标量替换**

当JVM通过逃逸分析，确定要将对象分配到栈上时，即时编译可以将对象打散，将对象替换为一个个很小的局部变量，我们将这个打散的过程叫做标量替换。将对象替换为一个个局部变量后，就可以非常方便的在栈上进行分配了。

**同步锁消除**

如果JVM通过逃逸分析，发现一个对象只能从一个线程被访问到，则访问这个对象时，可以不加同步锁。如果程序中使用了synchronized锁，则JVM会将synchronized锁消除。

**这里，需要注意的是：这种情况针对的是synchronized锁，而对于Lock锁，则JVM并不能消除。**

要开启同步消除，需要加上 -XX:+EliminateLocks 参数。因为这个参数依赖逃逸分析，所以同时要打开 -XX:+DoEscapeAnalysis 选项。

**所以，并不是所有的对象和数组，都是在堆上进行分配的，由于即时编译的存在，如果JVM发现某些对象没有逃逸出方法，就很有可能被优化成在栈上分配。**





# 五、方法区

![image-20220321164547903](https://s2.loli.net/2022/03/21/hlLGwa5NyC2tAjW.png)

1. 线程共享区域
2. **存储与类结构相关的信息**（如运行时常量池、字段和方法数据，以及方法和构造函数的代码，包括用于类和实例初始化和接口初始化的特殊方法）
3. 虚拟机启动时创建，**逻辑上是堆的组成部分**，方法区看作是一块独立于 Java 堆的内存空间。
4. When creating a class or interface, if the construction of the run-time constant pool requires more memory than can be made available in the method area of the Java Virtual Machine, the Java Virtual Machine throws an `OutOfMemoryError`.



![image-20220311164809183](https://s2.loli.net/2022/03/11/vSwzAcp9lX34BeK.png)

《深入理解 Java 虚拟机》书中对方法区（Method Area）存储内容描述如下：它用于存储已被虚拟机加载的类型信息、常量、静态变量、即时编译器编译后的代码缓存等。

![image-20220321164800647](https://s2.loli.net/2022/03/21/F5w28qJYtzsCdy4.png)

## 类型信息

对每个加载的类型（类 class、接口 interface、枚举 enum、注解 annotation），JVM 必须在方法区中存储以下类型信息：

- 这个类型的完整有效名称（全名=包名.类名）
- 这个类型直接父类的完整有效名（对于 interface 或是 java.lang.object，都没有父类）
- 这个类型的修饰符（public，abstract，final 的某个子集）
- 这个类型直接接口的一个有序列表

## 域信息

JVM 必须在方法区中保存类型的所有域的相关信息以及域的声明顺序。
域的相关信息包括：域名称、域类型、域修饰符（public，private，protected，static，final，volatile，transient 的某个子集）

## 方法信息

JVM 必须保存所有方法的以下信息，同域信息一样包括声明顺序：

- 方法名称
- 方法的返回类型（或 void）
- 方法参数的数量和类型（按顺序）
- 方法的修饰符（public，private，protected，static，final，synchronized，native，abstract 的一个子集）
- 方法的字节码（bytecodes）、操作数栈、局部变量表及大小（abstract 和 native 方法除外）
- 异常表（abstract 和 native 方法除外）
  - 每个异常处理的开始位置、结束位置、代码处理在程序计数器中的偏移地址、被捕获的异常类的常量池索引

## non-final的类变量

静态变量和类关联在一起，随着类的加载而加载，他们成为类数据在逻辑上的一部分
类变量被类的所有实例共享，即使没有类实例时，你也可以访问它

## 全局常量

全局常量就是使用 static final 进行修饰
被声明为 final 的类变量的处理方法则不同，每个全局常量在编译的时候就会被分配了。







## 运行时常量池

- 常量池，就是一张表，虚拟机指令根据这张常量表找到要执行的类名、方法名、参数类型、字面量 等信息 
- 运行时常量池，常量池是 *.class 文件中的，当该类被加载，它的常量池信息就会放入运行时常量 池，并把里面的符号地址变为真实地址

- 运行时常量池（Runtime Constant Pool），它是方法区的一部分。Class文件中除了有类的版本、字段、方法、接口等描述等信息外，还有一项信息是常量池（Constant Pool Table），用于存放编译期生成的**各种字面量**和**符号引用**，这部分内容将在类加载后存放到常量池中。

## 常量池与串池的关系

#### **串池**StringTable

**特征**

- 常量池中的字符串仅是符号，只有**在被用到时才会转化为对象**
- 利用串池的机制，来避免重复创建字符串对象
- 字符串**变量**拼接的原理是**StringBuilder**
- 字符串**常量**拼接的原理是**编译器优化**
- 可以使用**intern方法**，主动将串池中还没有的字符串对象放入串池中
- **注意**：无论是串池还是堆里面的字符串，都是对象

用来放字符串对象且里面的**元素不重复**

```java
public class StringTableStudy {
	public static void main(String[] args) {
		String a = "a"; 
		String b = "b";
		String ab = "ab";
	}
}
```

常量池中的信息，都会被加载到运行时常量池中，但这是a b ab 仅是常量池中的符号，**还没有成为java字符串**

```java
0: ldc           #2                  // String a
2: astore_1
3: ldc           #3                  // String b
5: astore_2
6: ldc           #4                  // String ab
8: astore_3
9: return
```

当执行到 ldc #2 时，会把符号 a 变为 “a” 字符串对象，**并放入串池中**（hashtable结构 不可扩容）

当执行到 ldc #3 时，会把符号 b 变为 “b” 字符串对象，并放入串池中

当执行到 ldc #4 时，会把符号 ab 变为 “ab” 字符串对象，并放入串池中

最终**StringTable [“a”, “b”, “ab”]**

**注意**：字符串对象的创建都是**懒惰的**，只有**当运行到那一行字符串且在串池中不存在的时候**（如 ldc #2）时，该字符串才会被创建并放入串池中。

使用拼接**字符串变量对象**创建字符串的过程

```java
public class StringTableStudy {
	public static void main(String[] args) {
		String a = "a";
		String b = "b";
		String ab = "ab";
		//拼接字符串对象来创建新的字符串
		String ab2 = a+b; 
	}
}
```

反编译后的结果

```java
	 Code:
      stack=2, locals=5, args_size=1
         0: ldc           #2                  // String a
         2: astore_1
         3: ldc           #3                  // String b
         5: astore_2
         6: ldc           #4                  // String ab
         8: astore_3
         9: new           #5                  // class java/lang/StringBuilder
        12: dup
        13: invokespecial #6                  // Method java/lang/StringBuilder."<init>":()V
        16: aload_1
        17: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        20: aload_2
        21: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        24: invokevirtual #8                  // Method java/lang/StringBuilder.toString:()Ljava/lang/Str
ing;
        27: astore        4
        29: return
```

通过拼接的方式来创建字符串的**过程**是：StringBuilder().append(“a”).append(“b”).toString()

最后的toString方法的返回值是一个**新的字符串**，但字符串的**值**和拼接的字符串一致，但是两个不同的字符串，**一个存在于串池之中，一个存在于堆内存之中**

```java
String ab = "ab";
String ab2 = a+b;
//结果为false,因为ab是存在于串池之中，ab2是由StringBuffer的toString方法所返回的一个对象，存在于堆内存之中
System.out.println(ab == ab2);
```



注意：1.8之后，串池在堆中，常量池在元空间中



使用**拼接字符串常量对象**的方法创建字符串

```java
public class StringTableStudy {
	public static void main(String[] args) {
		String a = "a";
		String b = "b";
		String ab = "ab";
		String ab2 = a+b;
		//使用拼接字符串的方法创建字符串
		String ab3 = "a" + "b";
	}
}
```

反编译后的结果

```java
 	  Code:
      stack=2, locals=6, args_size=1
         0: ldc           #2                  // String a
         2: astore_1
         3: ldc           #3                  // String b
         5: astore_2
         6: ldc           #4                  // String ab
         8: astore_3
         9: new           #5                  // class java/lang/StringBuilder
        12: dup
        13: invokespecial #6                  // Method java/lang/StringBuilder."<init>":()V
        16: aload_1
        17: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        20: aload_2
        21: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        24: invokevirtual #8                  // Method java/lang/StringBuilder.toString:()Ljava/lang/Str
ing;
        27: astore        4
        //ab3初始化时直接从串池中获取字符串
        29: ldc           #4                  // String ab
        31: astore        5
        33: return
```

- 使用**拼接字符串常量**的方法来创建新的字符串时，因为**内容是常量，javac在编译期会进行优化，结果已在编译期确定为ab**，而创建ab的时候已经在串池中放入了“ab”，所以ab3直接从串池中获取值，所以进行的操作和 ab = “ab” 一致。
- 使用**拼接字符串变量**的方法来创建新的字符串时，因为内容是**变量**，只能**在运行期确定它的值，所以需要使用StringBuilder来创建**

#### inter方法—— JDK1.8及以后

调用字符串对象的intern方法，会将该字符串对象尝试放入到串池中

- 如果串池中没有该字符串对象，则放入成功
- 如果有该字符串对象，则放入失败

无论放入是否成功，都会返回**串池中**的字符串对象

**注意**：此时如果调用intern方法成功，堆内存与串池中的字符串对象是同一个对象；如果失败，则不是同一个对象

例1

```java
public class Main {
	public static void main(String[] args) {
		//"a" "b" 被放入串池中，str则存在于堆内存之中
		String str = new String("a") + new String("b");
		//调用str的intern方法，这时串池中没有"ab"，则会将该字符串对象放入到串池中，此时堆内存与串池中的"ab"是同一个对象
		String st2 = str.intern();
		//给str3赋值，因为此时串池中已有"ab"，则直接将串池中的内容返回
		String str3 = "ab";
		//因为堆内存与串池中的"ab"是同一个对象，所以以下两条语句打印的都为true
		System.out.println(str == st2);
		System.out.println(str == str3);
	}
}
```

例2

```java
public class Main {
	public static void main(String[] args) {
        //此处创建字符串对象"ab"，因为串池中还没有"ab"，所以将其放入串池中
		String str3 = "ab";
        //"a" "b" 被放入串池中，str则存在于堆内存之中
		String str = new String("a") + new String("b");
        //此时因为在创建str3时，"ab"已存在与串池中，所以放入失败，但是会返回串池中的"ab"
		String str2 = str.intern();
        //false
		System.out.println(str == str2);
        //false
		System.out.println(str == str3);
        //true
		System.out.println(str2 == str3);
	}
}
```



#### inter方法——JDK 1.6

调用字符串对象的intern方法，会将该字符串对象尝试放入到串池中

- 如果串池中没有该字符串对象，会将该字符串对象复制一份，再放入到串池中
- 如果有该字符串对象，则放入失败

无论放入是否成功，都会返回**串池中**的字符串对象

**注意**：此时无论调用intern方法成功与否，串池中的字符串对象和堆内存中的字符串对象**都不是同一个对象**



#### StringTable位置

![image-20220315090718680](https://s2.loli.net/2022/03/15/TawY28sSGNZEtle.png)

因为永久代垃圾回收效率不高，而且字符串需要大量使用



#### StringTable垃圾回收

StringTable在内存紧张时，会发生垃圾回收

- 因为StringTable是由HashTable实现的，所以可以**适当增加HashTable桶的个数**，来减少字符串放入串池所需要的时间

  ```
  -XX:StringTableSize=xxxxCopy
  ```

  

- 考虑是否需要将字符串对象入池

  可以通过**intern方法减少重复入池**

## 元空间与永久代

### 永久代

Java7及以前版本的Hotspot中**方法区位于永久代**中。同时，永久代和堆是相互隔离的，但它们使用的**物理内存是连续**的。

永久代的垃圾收集是和老年代捆绑在一起的，因此无论谁满了，都会触发永久代和老年代的垃圾收集。

### 元空间

在Java8中，元空间(Metaspace)登上舞台，**方法区存在于元空间**(Metaspace)。同时，元空间不再与堆连续，而且是存在于**本地内存**（Native memory）。

### 为什么用元空间替换永久代？

表面上看是为了避免OOM异常。因为通常使用PermSize和MaxPermSize设置永久代的大小就决定了永久代的上限，但是不是总能知道应该设置为多大合适, 如果使用默认值很容易遇到OOM错误。

当使用元空间时，可以加载多少类的元数据就不再由MaxPermSize控制, 而由系统的实际可用空间来控制。

更深层的原因还是要合并HotSpot和JRockit的代码，JRockit从来没有所谓的永久代，也不需要开发运维人员设置永久代的大小，但是运行良好。同时也不用担心运行性能问题了,在覆盖到的测试中, 程序启动和运行速度降低不超过1%，但是这点性能损失换来了更大的安全保障。

## 方法区垃圾回收

有些人认为方法区（如 Hotspot 虚拟机中的元空间或者永久代）是没有垃圾收集行为的，其实不然。《Java 虚拟机规范》对方法区的约束是非常宽松的，提到过可以不要求虚拟机在方法区中实现垃圾收集。事实上也确实有未实现或未能完整实现方法区类型卸载的收集器存在（如 JDK11 时期的 ZGC 收集器就不支持类卸载）。
	一般来说这个区域的回收效果比较难令人满意，尤其是类型的卸载，条件相当苛刻。但是这部分区域的回收有时又确实是必要的。以前 sun 公司的 Bug 列表中，曾出现过的若干个严重的 Bug 就是由于低版本的 HotSpot 虚拟机对此区域未完全回收而导致内存泄漏。
	方法区的垃圾收集主要回收两部分内容：常量池中废弃的常量和不再使用的类型。
先来说说方法区内常量池之中主要存放的两大类常量：字面量和符号引用。字面量比较接近 Java 语言层次的常量概念，如文本字符串、被声明为 final 的常量值等。而符号引用则属于编译原理方面的概念，包括下面三类常量：

- 类和接口的全限定名
- 字段的名称和描述符
- 方法的名称和描述符


HotSpot 虚拟机对常量池的回收策略是很明确的，只要常量池中的常量没有被任何地方引用，就可以被回收。

回收废弃常量与回收 Java 堆中的对象非常类似。（关于常量的回收比较简单，重点是类的回收）

​	判定一个常量是否“废弃”还是相对简单，而要判定一个类型是否属于“不再被使用的类”的条件就比较苛刻了。需要同时满足下面三个条件：

- 该类所有的实例都已经被回收，也就是 Java 堆中不存在该类及其任何派生子类的实例。
- 加载该类的类加载器已经被回收，这个条件除非是经过精心设计的可替换类加载器的场景，如 OSGi、JSP 的重加载等，否则通常是很难达成的。
- 该类对应的 java.lang.Class 对象没有在任何地方被引用，无法在任何地方通过反射访问该类的方法。

​		Java 虚拟机被允许对满足上述三个条件的无用类进行回收，这里说的仅仅是“被允许”，而并不是和对象一样，没有引用了就必然会回收。关于是否要对类型进行回收，HotSpot 虚拟机提供了 -Xnoclassgc 参数进行控制，还可以使用 -verbose:class 以及 -XX：+TraceClass-Loading、-XX：+TraceClassUnLoading 查看类加载和卸载信息
在大量使用反射、动态代理、CGLib等字节码框架，动态生成 JSP 以及 oSGi 这类频繁自定义类加载器的场景中，通常都需要 Java 虚拟机具备类型卸载的能力，以保证不会对方法区造成过大的内存压力。







## 方法区内存溢出

- 1.8以前会导致永久代内存溢出

- 1.8 之后会导致元空间内存溢出



# 栈、堆、方法区的交互关系

![image-20220321163806537](https://s2.loli.net/2022/03/21/gsw1rZmBfQYuOJa.png)

![image-20220321164021998](https://s2.loli.net/2022/03/21/3IpEu2G9k5U6Yco.png)

方法区主要存放的是 Class，而堆中主要存放的是 实例化的对象

- 方法区（Method Area）与 Java 堆一样，是各个线程共享的内存区域。
  方法区在 JVM 启动的时候被创建，并且它的实际的物理内存空间中和 Java 堆区一样都可以是不连续的。

- 方法区的大小，跟堆空间一样，可以选择固定大小或者可扩展。

- 方法区的大小决定了系统可以保存多少个类，如果系统定义了太多的类，导致方法区溢出，虚拟机同样会抛出内存溢出错误：java.lang.OutofMemoryError：PermGen space 或者 java.lang.OutOfMemoryError:Metaspace

  - 加载大量的第三方的 jar 包
  - Tomcat 部署的工程过多（30~50 个）
  - 大量动态的生成反射类

  关闭 JVM 就会释放这个区域的内存。

# 六、直接内存

![image-20220315093608947](https://s2.loli.net/2022/03/15/pV3rxW2itLuwH4o.png)

- 属于操作系统，常见于NIO操作时，**用于数据缓冲区**（例如Bytebuffer使用的直接内存）
- 分配回收成本较高，但读写性能高
- **不受JVM内存回收管理**



## 基本使用

为什么使用直接内存（Bytebuffer）读写大文件效率高？

#### 文件读写流程

[![img](https://s2.loli.net/2022/03/15/lGYFydfxkDpQM1E.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150715.png)

**使用了DirectBuffer**

[![img](https://s2.loli.net/2022/03/15/cOx4ZU9ds8QnRj2.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150736.png)

直接内存是操作系统和Java代码**都可以访问的一块区域**，无需将代码从系统内存复制到Java堆内存，从而提高了效率



## 内存溢出

**不受JVM内存回收管理**，会不会产生内存溢出等问题？

直接内存的回收不是通过JVM的垃圾回收来释放的，而是通过**unsafe.freeMemory**来手动释放



# 七、垃圾回收

![image-20220321163103569](https://s2.loli.net/2022/03/21/lOkevPgtWIznHKh.png)

问题1：目前内存的动态分配与内存回收技术已经相当成熟，为什么还要了解GC和内存分配呢？

1. 排查各种内存溢出，内存泄漏问题时
2. 垃圾收集成为系统达到**更高并发量**的瓶颈时

问题2：为什么只有堆内存需要垃圾回收？

方法或者线程结束时，内存自然跟着回收了。

1. 程序计数器、虚拟机栈、本地方法栈生命周期与线程相同
2. 栈中的栈帧出栈自动释放内存
3. 每个栈帧分配内存是在类结构确定下来时就已知了

因此这个区域的内存分配和回收具有确定性。 而只有程序处于运行期间时才能知道会创建哪些对象，这部分内存的分配和回收都是动态的

## 1. 如何判断对象可以回收

### 1.1 引用计数法

只要对象被其他对象所引用，对象的计数器加一，不再引用，计数减一，为0时被回收（java虚拟机未采用，早期python虚拟机采用）

缺点：

​	若两个对象**互相引用**，但是没有其他对象再引用了，因为计数器不为0，所以都不能被回收，容易导致内存泄漏，所以主流虚拟机不常使用

[![img](https://s2.loli.net/2022/03/16/lzkDg8TwZ3SHx5W.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150750.png)

### 1.2 可达性分析算法

**根对象**(GC ROOT)：肯定不能被当成垃圾被回收的对象

- 虚拟机栈（栈帧中的本地变量表）中引用的对象
- 方法区中类静态属性引用的对象
- 方法区中常量引用的对象
- 本地方法栈中JNI引用的对象

如果一个对象没有被根对象直接或间接的引用，那么可以被回收掉。

- JVM中的垃圾回收器通过**可达性分析**来探索所有存活的对象

- 扫描堆中的对象，看能否沿着GC Root对象为起点的引用链找到该对象，如果**找不到，则表示可以回收**

- 可以作为GC Root的对象
  - 虚拟机栈（栈帧中的本地变量表）中引用的对象。　![image-20220321171030276](https://s2.loli.net/2022/03/21/C1FoXrRMkYPJa9s.png)
  
  - 方法区中类静态属性引用的对象（一般指被static修饰的对象，加载类的时候就加载到内存中。）
  
    ![image-20220321171148653](https://s2.loli.net/2022/03/21/noBYurQkzSEXxLF.png)
  
  - 方法区中常量引用的对象
  
    ![image-20220321171228624](https://s2.loli.net/2022/03/21/3QZfzugO8RTVAh2.png)
  
    代码存疑
  
  - 本地方法栈中JNI（即一般说的Native方法）引用的对象

### 1.3 四种引用

1. 强引用
2. 软引用
3. 弱引用
4. 虚引用
5. 终结器引用

[![img](https://s2.loli.net/2022/03/16/iplc2NsubWPMO14.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150800.png)

##### 强引用

只有GC Root**都不引用**该对象时，才会回收**强引用**对象

- 如上图B、C对象都不引用A1对象时，A1对象才会被回收

##### 软引用

当GC Root指向软引用对象时，在**内存不足时**，会**回收软引用所引用的对象**

- 如上图如果B对象不再引用A2对象且内存不足时，软引用所引用的A2对象就会被回收

##### 弱引用

只有弱引用引用该对象时，在垃圾回收时，**无论内存是否充足**，都会回收弱引用所引用的对象

- 如上图如果B对象不再引用A3对象，则A3对象会被回收

**弱引用的使用和软引用类似**，只是将 **SoftReference 换为了 WeakReference**

如果在垃圾回收时发现内存不足，在回收软引用所指向的对象时，**软引用本身不会被清理**，软引用和弱引用本身也占有一定内存

如果想要**清理软引用**，需要使**用引用队列**



区别于以上两个引用不一定需要引用队列配合使用，以下两个必须使用引用队列

##### **虚引用**

当虚引用对象所引用的对象被回收以后，虚引用对象就会被放入引用队列中，调用虚引用的方法

- 虚引用的一个体现是**释放直接内存所分配的内存**，当引用的对象ByteBuffer被垃圾回收以后，虚引用对象Cleaner就会被放入引用队列中，然后调用Cleaner的clean方法（clean方法调用Unsafe.freeMemory）来**释放直接内存**
- 如上图，B对象不再引用ByteBuffer对象，ByteBuffer就会被回收。但是直接内存中的内存还未被回收。这时需要将虚引用对象Cleaner放入引用队列中，然后调用它的clean方法来释放直接内存

##### 终结器引用

所有的类都继承自Object类，Object类有一个finalize方法。当某个对象不再被其他的对象所引用时，会先将终结器引用对象**放入引用队列**中，然后一个**优先级较低**（易长时间不被回收，不推荐使用finilize方法）的线程间接根据终结器引用对象找到它所引用的对象，然后调用该对象的finalize方法。调用以后，该对象就可以被垃圾回收了

## 2. 垃圾回收算法



以下几种算法根据情况共同实现垃圾回收

### 2.1 标记清除

[![img](https://s2.loli.net/2022/03/17/fFotU3BNp4KCnuD.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150813.png)

**定义**：标记清除算法顾名思义，是指在虚拟机执行垃圾回收的过程中，先采用标记算法确定可回收对象，然后垃圾收集器根据标识清除相应的内容，给堆内存腾出相应的空间

- 这里的腾出内存空间**并不是将内存空间的字节清0**，而是记录下这段内存的起始结束地址（空闲地址列表），下次分配内存的时候，会直接**覆盖**这段内存

**优点**：速度快，只需要记录清除地址

**缺点**：**容易产生大量的内存碎片**，可能无法满足大对象的内存分配，一旦导致无法分配对象，那就会导致jvm启动gc，一旦启动gc，我们的应用程序就会暂停，这就导致应用的响应速度变慢

### 2.2 标记整理

复制算法在对象存活率较高时需要较多的复制操作，效率会变低，而且如果不想浪费50%的空间，就需要额外的空间进行分配担保，以应对被使用的内存中所有对象都100%存活的极端情况。

适用于**老年代**的标记整理算法

区别在于第二步，为了避免内存碎片问题，将可用内存向前移动，让内存更加紧凑

[![img](https://s2.loli.net/2022/03/17/qZrhYpkxFCcnPKA.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150827.png)

**优点**：减少内存碎片

**缺点**：效率较低

### 2.3 复制

常用于**新生代**

[![img](https://s2.loli.net/2022/03/17/nZ71dHgtYTbBq5S.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150842.png)



[![img](https://s2.loli.net/2022/03/17/CUubAca15khHgwB.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150919.png)

将内存分为等大小的两个区域，FROM和TO（TO中为空）。先将被GC Root引用的对象从FROM放入TO中，再回收不被GC Root引用的对象。然后交换FROM和TO。

这样也可以避免内存碎片的问题，但是会**占用双倍的内存空间**。



## 3. 分代回收

堆内存中根据生命周期不同进行划分

在 Java 中，堆被划分成两个不同的区域：新生代 ( Young )、老年代 ( Old )，新生代默认占总空间的 1/3，老年代默认占 2/3。 新生代有 3 个分区：Eden、To Survivor、From Survivor，它们的默认占比是 8:1:1。

老年代：长时间使用的对象的存放位置，因为对象存活率高，没有额外空间进行分配担保，就需要标记-清理或整理进行回收

新生代：98%对象的生命周期较短的，用完就丢弃，垃圾回收较频繁，因此适合只需要付出少量复制成本的复制算法进行垃圾回收 

**不同生命周期的垃圾回收策略不同**

[![img](https://s2.loli.net/2022/03/17/DYIVRSc2y4xHpLN.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150931.png)

### Minor GC

#### 第一次Minor GC

新对象会创建在伊甸园中

[![img](https://s2.loli.net/2022/03/17/b9iSrG3IZkuM4Ol.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150939.png)

伊甸园占满时触发一次垃圾回收（新生代的垃圾回收 **Minor GC**），利用**可达性分析算法**寻找需要回收的对象并标记，之后利用**复制算法**，将存活对象放到幸存区To中，幸存对象的寿命+1，伊甸园剩余对象回收，交换from，to。之后可以继续向伊甸园分配对象

[![img](https://s2.loli.net/2022/03/17/Wbz7JudZk8ESRMD.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150946.png)

[![img](https://s2.loli.net/2022/03/17/aohtJPnRLNMfDvj.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150955.png)

[![img](https://s2.loli.net/2022/03/17/Wto51rdmLnRNJUS.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151002.png)



#### 第二次Minor GC

再次创建对象，若新生代的伊甸园又满了，则会**再次触发 Minor GC**（会触发 **stop the world**， 暂停其他用户线程，只让垃圾回收线程工作,因为会牵扯到对象地址的改变），这时不仅会回收伊甸园中的垃圾，**还会回收幸存区中的垃圾**，再将活跃对象复制到幸存区TO中。回收以后会交换两个幸存区，并让幸存区中的对象**寿命加1**



当幸存区from中**寿命超过一定阈值**（最大为15，存寿命的地方为4bit）后，晋升到**老年代**中

### Full GC

如果新生代老年代中的内存都满了，就会先触发Minor GC，再触发**Full GC**，扫描**新生代和老年代中**所有不再使用的对象并回收



### GC分析

##### 大对象处理策略

当遇到一个**较大的对象**时，就算新生代的**伊甸园**为空，也**无法容纳该对象**时，会将该对象**直接晋升为老年代**

##### 线程内存溢出

某个线程的内存溢出了而抛异常（out of memory），不会让其他的线程结束运行

这是因为当一个线程**抛出OOM异常后**，**它所占据的内存资源会全部被释放掉**，从而不会影响其他线程的运行，**进程依然正常**



## 4. 垃圾回收器

![image-20220321194644613](https://s2.loli.net/2022/03/21/LD9Ohtkn1wGRfbz.png)

单核 cpu 下，线程实际还是 串行执行 的。操作系统中有一个组件叫做任务调度器，将 cpu 的时间片（windows 下时间片最小约为 15 毫秒）分给不同的程序使用，只是由于 cpu 在线程间（时间片很短）的切换非常快，人类感 觉是 同时运行的 。总结为一句话就是： 微观串行，宏观并行 。

**并行收集**：指多条垃圾收集线程并行工作，但此时**用户线程仍处于等待状态**。

**并发收集**：指用户线程与垃圾收集线程**同时工作**（不一定是并行的可能会交替执行）。**用户程序在继续运行**，而垃圾收集程序运行在另一个CPU上

### 1. 串行

- 单线程
- 内存较小，适合个人电脑（CPU核数较少）

[![img](https://s2.loli.net/2022/03/17/USm86izBfGYJrhX.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151027.png)

**安全点**：让其他线程都在这个点停下来，以免垃圾回收时**移动对象地址**，使得其他线程找不到被移动的对象

因为是串行的，所以只有一个垃圾回收线程。且在该线程执行回收工作时，其他线程进入**阻塞**状态

##### Serial 收集器

Serial收集器是最基本的、发展历史最悠久的收集器

**特点：**单线程、简单高效（与其他收集器的单线程相比），采用**复制算法**。对于限定单个CPU的环境来说，Serial收集器由于没有线程交互的开销，专心做垃圾收集自然可以获得最高的单线程手机效率。**收集器进行垃圾回收时，必须暂停其他所有的工作线程**，直到它结束（Stop The World）

所有收集器里额外内存消耗最小的

##### ParNew 收集器

ParNew收集器其实就是**Serial收集器的多线程版本**

**特点**：多线程、ParNew收集器默认开启的收集线程数与CPU的数量相同，在CPU非常多的环境中，可以使用-XX:ParallelGCThreads参数来限制垃圾收集的线程数。和Serial收集器一样存在Stop The World问题

##### Serial Old 收集器

Serial Old是Serial收集器的**老年代**版本

**特点**：同样是单线程收集器，采用**标记-整理算法**

### 2. 吞吐量优先

- 多线程
- 堆内存较大，多核cpu
- 单位时间内，STW（stop the world，停掉其他所有工作线程）时间最短 0.2 0.2 = 0.4
- **JDK1.8默认使用**的垃圾回收器

[![img](https://s2.loli.net/2022/03/17/xbd72gerDBFwjYN.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151039.png)

##### Parallel Scavenge 收集器

**吞吐量**：即CPU用于**运行用户代码的时间**与CPU**总消耗时间**的比值（吞吐量 = 运行用户代码时间 / ( 运行用户代码时间 + 垃圾收集时间 )），也就是。例如：虚拟机共运行100分钟，垃圾收集器花掉1分钟，那么吞吐量就是99%

与吞吐量关系密切，故也称为吞吐量优先收集器

**特点**：属于**新生代**收集器也是采用**复制算法**的收集器（用到了新生代的幸存区），又是并行的多线程收集器（与ParNew收集器类似）

该收集器的目标是达到一个可控制的吞吐量。还有一个值得关注的点是：**GC自适应调节策略**（与ParNew收集器最重要的一个区别）

**GC自适应调节策略**：Parallel Scavenge收集器可设置-XX:+UseAdptiveSizePolicy参数。当开关打开时**不需要**手动指定新生代的大小（-Xmn）、Eden与Survivor区的比例（-XX:SurvivorRation）、晋升老年代的对象年龄（-XX:PretenureSizeThreshold）等，虚拟机会根据系统的运行状况收集性能监控信息，动态设置这些参数以提供**最优的停顿时间和最高的吞吐量**，这种调节方式称为GC的自适应调节策略。

Parallel Scavenge收集器使用两个参数控制吞吐量：

- XX:MaxGCPauseMillis 控制最大的垃圾收集停顿时间
- XX:GCRatio 直接设置吞吐量的大小

##### **Parallel Old 收集器**

是Parallel Scavenge收集器的老年代版本

**特点**：多线程，采用**标记-整理算法**（老年代没有幸存区）

### 3. 响应时间优先



- 多线程
- 堆内存较大，多核cpu

- 尽可能让单次STW时间变短（尽量不影响其他线程运行） 0.1 0.1 0.1 0.1 0.1 = 0.5

[![img](https://s2.loli.net/2022/03/17/FMiSVyx1lnsw6XE.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151052.png)

##### CMS 收集器

Concurrent **Mark Sweep**，一种以获取**最短回收停顿时间**为目标的**老年代**收集器

**特点**：基于**标记-清除算法**实现。并发收集、低停顿，但是会产生内存碎片

**应用场景**：适用于注重服务的响应速度，希望系统停顿时间最短，给用户带来更好的体验等场景下。如web程序、b/s服务

**CMS收集器的运行过程分为下列4步：**

**初始标记**：标记GC Roots能直接到的对象。速度很快但是**仍存在Stop The World问题**

**并发标记**：根据上一步的结果，继续向下标识所有关联的对象，直到这条链上的最尽头。是进行GC Roots Tracing 的过程，找出存活对象且用户线程可**并发执行**(不需要STW)

**重新标记**：为了**修正并发标记期间**因用户程序继续运行而导致标记产生变动的那一部分对象的标记记录。仍然存在**Stop The World**问题 （较慢）

**并发清除**：对标记的对象进行清除回收-

CMS收集器的内存回收过程是与用户线程一起**并发执行**的，只有初始标记和重新标记需要STW



**缺点**：

1. **并发回收导致CPU资源紧张：**

   在并发阶段，它虽然不会导致用户线程停顿，但却会因为占用了一部分线程而导致应用程序变慢，降低程序总吞吐量。CMS默认启动的回收线程数是：（CPU核数 + 3）/ 4，当CPU核数不足四个时，CMS对用户程序的影响就可能变得很大。

2. 无法处理浮动垃圾

   （并发清除时，用户线程还在运行，可能还会有新垃圾产生，CMS无法在当次收集中处理），因为在垃圾收集阶段用户线程还需要运行，因此还需要留有足够内存空间给用户线程使用，不能等老年代几乎被填满了再进行收集，需要预留一部分空间提供并发收集时的程序运作使用；

3. 内存碎片过多

   CMS是一款基于“标记-清除”算法实现的回收器，这意味着回收结束时会有内存碎片产生。内存碎片过多时，将会给大对象分配带来麻烦，往往会出现老年代还有很多剩余空间，但就是无法找到足够大的连续空间来分配当前对象，而不得不提前触发一次 Full GC 的情况。

   为了解决这个问题，CMS收集器提供了一个 -XX**:**+UseCMSCompactAtFullCollection 开关参数（默认开启），用于在 Full GC 时开启内存碎片的合并整理过程，由于这个内存整理必须移动存活对象，是无法并发的，这样**停顿时间就会变长**。还有另外一个参数 -XX**:**CMSFullGCsBeforeCompaction，这个参数的作用是要求CMS在执行过若干次不整理空间的 Full GC 之后，下一次进入 Full GC 前会先进行碎片整理（默认值为0，表示每次进入 Full GC 时都进行碎片整理）。

4. 并发失败（Concurrent Mode Failure）

   由于在垃圾回收阶段用户线程还在并发运行，那就还需要预留足够的内存空间提供给用户线程使用，因此CMS不能像其他回收器那样等到老年代几乎完全被填满了再进行回收，必须预留一部分空间供并发回收时的程序运行使用。默认情况下，当老年代使用了 92% 的空间后就会触发 CMS 垃圾回收，这个值可以通过 -XX**:** CMSInitiatingOccupancyFraction 参数来设置。

   这里会有一个风险：要是CMS运行期间预留的内存无法满足程序分配新对象的需要，就会出现一次“并发失败”（Concurrent Mode Failure），这时候虚拟机将不得不启动后备预案：Stop The World，临时启用 Serial Old 来重新进行老年代的垃圾回收，这样一来停顿时间就很长了。

### 4. G1

定义： Garbage First

JDK 9以后默认使用，而且替代了CMS 收集器

**适用场景**

- 同时注重吞吐量和低延迟（响应时间）
- 超大堆内存（内存大的），会将堆内存划分为多个**大小相等**的区域
- 整体上是**标记-整理**算法，两个区域之间是**复制**算法

#### 1) G1 垃圾回收阶段

[![img](https://s2.loli.net/2022/03/21/C6wqJsFhujS5fDz.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151109.png)

新生代伊甸园垃圾回收—–>内存不足，新生代回收+并发标记—–>回收新生代伊甸园、幸存区、老年代内存——>新生代伊甸园垃圾回收(重新开始)

#### 2）Young Collection

分代是按对象的生命周期划分，分区则是将堆空间划分连续几个不同小区间，每一个小区间独立回收，可以控制一次回收多少个小区间，方便控制 GC 产生的停顿时间

E：伊甸园 S：幸存区 O：老年代

- 会STW

  [![img](https://s2.loli.net/2022/03/21/rRbJgSw8VCXyejn.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151119.png)

  [![img](https://s2.loli.net/2022/03/21/f1IWZgbEwU3M2ni.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151129.png)

  [![img](https://s2.loli.net/2022/03/21/2D9BH1S7xU4fA3r.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151140.png)



#### 3) Young Collection + CM

CM：并发标记

- 在 Young GC 时会**对 GC Root 进行初始标记**
- 在老年代**占用堆内存的比例**达到阈值时，对进行并发标记(从根对象出发，寻找其他标记对象，与CMS类似)（不会STW），阈值可以根据用户来进行设定

#### 4）Mixed Collection

会对E S O 进行**全面的回收**

- 最终标记 会STW
- **拷贝**存活 会STW

-XX:MaxGCPauseMills:xxx 用于指定最长的停顿时间

**问**：为什么有的老年代被拷贝了，有的没拷贝？

因为指定了最大停顿时间，如果对所有老年代都进行回收，耗时可能过高。为了保证时间不超过设定的停顿时间，会**回收最有价值的老年代**（回收后，能够得到更多内存）

Garbage first: 优先回收垃圾最多的区域，使暂停时间短

[![img](https://s2.loli.net/2022/03/21/VJT1jz7ep9SaDIc.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151201.png)



#### 5） Full GC

G1在老年代内存不足时（老年代所占内存超过阈值）

- 如果垃圾产生速度慢于垃圾回收速度，不会触发Full GC，还是并发地进行清理
- 如果垃圾产生速度快于垃圾回收速度，便会触发Full GC



#### 6) Young Collection 跨代引用

- 新生代回收的跨代引用（老年代引用新生代）问题

[![img](https://s2.loli.net/2022/03/21/ujqfy6kixo1IUaT.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151211.png)

- 卡表与Remembered Set
  - Remembered Set 存在于E中，用于保存新生代对象对应的脏卡
    - 脏卡：O被划分为多个区域（一个区域512K），如果该区域引用了新生代对象，则该区域被称为脏卡
- 在引用变更时通过post-write barried + dirty card queue
- concurrent refinement threads 更新 Remembered Set

[![img](https://s2.loli.net/2022/03/21/MDUnw9iq6COvSGZ.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151222.png)



#### 7) Remark

重新标记阶段

在垃圾回收时，收集器处理对象的过程中

黑色：已被处理，需要保留的 灰色：正在处理中的 白色：还未处理的

[![img](https://s2.loli.net/2022/03/21/GbC5znew9uOVyrN.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151229.png)

原因：在**并发标记过程中**，有可能A被处理了以后未引用C，但该处理过程还未结束，在处理过程结束之前A引用了C，这时就会用到**remark**

过程如下

- 并发标记时用户线程：之前C未被引用，这时A引用了C，就会给C加一个写屏障，写屏障的指令会被执行，将C放入一个队列当中，并将C变为 **处理中** 状态
- 在**并发标记**阶段结束以后，重新标记阶段会**STW**，然后将放在该队列中的对象重新处理，发现有强引用引用它，就会处理它

[![img](https://s2.loli.net/2022/03/21/LBxcoz2WmSVCZ8q.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151239.png)



### 5. GC调优

查看虚拟机参数命令

```
"F:\JAVA\JDK8.0\bin\java" -XX:+PrintFlagsFinal -version | findstr "GC"
```

#### 5.1 **调优领域**

- 内存
- 锁竞争
- CPU占用
- IO
- GC

#### 5.2 **确定目标**

低延迟/高吞吐量？ 选择合适的GC

- CMS（最多使用，JDK 9以后推荐使用G1） G1 ZGC（Java 12） （低延迟）

- ParallelGC（高吞吐量）

- Zing

  

#### 5.3 **最快的GC是不发生GC**

首先排除减少因为自身编写的代码而引发的内存问题

- 查看Full GC前后的内存占用，考虑以下几个问题

  - 数据是不是太多？

    resultSet = statement.executeQuery(select  * from x)

  - 数据表示是否太臃肿

    - 对象图

      不需要一次性取出来对象的所有属性

    - 对象大小

      16   Integer 24字节  int 4字节

  - 是否存在内存泄漏

    - static Map map 频繁放入数据
    - 软引用
    - 弱引用
    - 第三方缓存实现

#### 5.4 新生代调优

优化空间更大

- 新生代的特点
  - 所有的new操作分配内存都是非常廉价的
    - TLAB
  - 死亡对象回收零代价
  - 大部分对象用过即死（朝生夕死）
  - MInor GC 所用时间远小于Full GC
- 新生代内存越大越好么？
  - 不是
    - 新生代内存太小：频繁触发Minor GC，会STW，会使得吞吐量下降
    - 新生代内存太大：老年代内存占比有所降低，会更频繁地触发Full GC。而且触发Minor GC时，清理新生代所花费的时间会更长
  - 新生代内存设置为内容纳[并发量*(请求-响应)]的数据为宜

#### 5.5 幸存区调优

- 幸存区需要能够保存 **当前活跃对象**+**需要晋升的对象**
- 晋升阈值配置得当，让长时间存活的对象尽快晋升

#### 5.6 老年代调优

以CMS为例

- 老年代内存越大越好
- 先尝试不做调优，如果没有Full GC 那么说明老年代空间很充裕，否则先尝试调优新生代
- 观察发生Full GC时老年代内存占用，将老年代内存预设调大1/4~1/3



# 八、类加载与字节码技术

一个Java文件从编码完成到最终执行，一般主要包括两个过程

- 编译
- 运行

**编译**，即把我们写好的java文件，通过javac命令编译成字节码，也就是我们常说的.class文件。

**运行**，则是把编译生成的.class文件交给Java虚拟机(JVM)执行。

而我们所说的类加载过程即是指JVM虚拟机把.class文件中类信息加载进内存，并进行解析生成对应的class对象的过程。

JVM在执行某段代码时，遇到了class A， 然而此时内存中并没有class A的相关信息，于是JVM就会到相应的class文件中去寻找class A的类信息，并加载进内存中，这就是我们所说的类加载过程。

由此可见，JVM不是一开始就把所有的类都加载进内存中，而是只有第一次遇到某个需要运行的类时才会加载，且**只加载一次**。

![image-20220328090910140](https://s2.loli.net/2022/03/28/qWSICvy5FuK2G4l.png)



## 1. 类文件结构

首先获得.class字节码文件

方法：

- 在文本文档里写入java代码（文件名与类名一致），将文件类型改为.java
- java终端中，执行javac X:...\XXX.java

以下是字节码文件

```java
0000000 ca fe ba be 00 00 00 34 00 23 0a 00 06 00 15 09 
0000020 00 16 00 17 08 00 18 0a 00 19 00 1a 07 00 1b 07 
0000040 00 1c 01 00 06 3c 69 6e 69 74 3e 01 00 03 28 29 
0000060 56 01 00 04 43 6f 64 65 01 00 0f 4c 69 6e 65 4e 
0000100 75 6d 62 65 72 54 61 62 6c 65 01 00 12 4c 6f 63 
0000120 61 6c 56 61 72 69 61 62 6c 65 54 61 62 6c 65 01 
0000140 00 04 74 68 69 73 01 00 1d 4c 63 6e 2f 69 74 63 
0000160 61 73 74 2f 6a 76 6d 2f 74 35 2f 48 65 6c 6c 6f 
0000200 57 6f 72 6c 64 3b 01 00 04 6d 61 69 6e 01 00 16 
0000220 28 5b 4c 6a 61 76 61 2f 6c 61 6e 67 2f 53 74 72 
0000240 69 6e 67 3b 29 56 01 00 04 61 72 67 73 01 00 13 
0000260 5b 4c 6a 61 76 61 2f 6c 61 6e 67 2f 53 74 72 69 
0000300 6e 67 3b 01 00 10 4d 65 74 68 6f 64 50 61 72 61 
0000320 6d 65 74 65 72 73 01 00 0a 53 6f 75 72 63 65 46 
0000340 69 6c 65 01 00 0f 48 65 6c 6c 6f 57 6f 72 6c 64
0000360 2e 6a 61 76 61 0c 00 07 00 08 07 00 1d 0c 00 1e 
0000400 00 1f 01 00 0b 68 65 6c 6c 6f 20 77 6f 72 6c 64 
0000420 07 00 20 0c 00 21 00 22 01 00 1b 63 6e 2f 69 74 
0000440 63 61 73 74 2f 6a 76 6d 2f 74 35 2f 48 65 6c 6c 
0000460 6f 57 6f 72 6c 64 01 00 10 6a 61 76 61 2f 6c 61 
0000500 6e 67 2f 4f 62 6a 65 63 74 01 00 10 6a 61 76 61 
0000520 2f 6c 61 6e 67 2f 53 79 73 74 65 6d 01 00 03 6f 
0000540 75 74 01 00 15 4c 6a 61 76 61 2f 69 6f 2f 50 72 
0000560 69 6e 74 53 74 72 65 61 6d 3b 01 00 13 6a 61 76 
0000600 61 2f 69 6f 2f 50 72 69 6e 74 53 74 72 65 61 6d 
0000620 01 00 07 70 72 69 6e 74 6c 6e 01 00 15 28 4c 6a 
0000640 61 76 61 2f 6c 61 6e 67 2f 53 74 72 69 6e 67 3b 
0000660 29 56 00 21 00 05 00 06 00 00 00 00 00 02 00 01 
0000700 00 07 00 08 00 01 00 09 00 00 00 2f 00 01 00 01 
0000720 00 00 00 05 2a b7 00 01 b1 00 00 00 02 00 0a 00 
0000740 00 00 06 00 01 00 00 00 04 00 0b 00 00 00 0c 00 
0000760 01 00 00 00 05 00 0c 00 0d 00 00 00 09 00 0e 00 
0001000 0f 00 02 00 09 00 00 00 37 00 02 00 01 00 00 00 
0001020 09 b2 00 02 12 03 b6 00 04 b1 00 00 00 02 00 0a 
0001040 00 00 00 0a 00 02 00 00 00 06 00 08 00 07 00 0b 
0001060 00 00 00 0c 00 01 00 00 00 09 00 10 00 11 00 00 
0001100 00 12 00 00 00 05 01 00 10 00 00 00 01 00 13 00 
0001120 00 00 02 00 14
```

根据 JVM 规范，**类文件结构**如下

```java
u4 			 magic
u2             minor_version;    
u2             major_version;    
u2             constant_pool_count;    
cp_info        constant_pool[constant_pool_count-1];    
u2             access_flags;    
u2             this_class;    
u2             super_class;   
u2             interfaces_count;    
u2             interfaces[interfaces_count];   
u2             fields_count;    
field_info     fields[fields_count];   
u2             methods_count;    
method_info    methods[methods_count];    
u2             attributes_count;    
attribute_info attributes[attributes_count];
```

### 1.1 魔数

u4 magic

对应字节码文件的0~3个字节

0000000 **ca fe ba be** 00 00 00 34 00 23 0a 00 06 00 15 09

### 1.2 版本

对应字节码文件的4~7个字节

u2 minor_version;

u2 major_version;

0000000 ca fe ba be **00 00 00 34** 00 23 0a 00 06 00 15 09

34H（16进制） = 52，代表JDK8

### 1.3 常量池

![image-20220328092519956](https://s2.loli.net/2022/03/28/sF1DUIMkorS8X3b.png)

对应字节码文件的8~9个字节

表示**常量池长度**，00 23 （35）表示常量池有#1~#34项，注意#0项不计入，也没有值

0000000 ca fe ba be 00 00 00 34 **00 23** 0a 00 06 00 15 09



第#1项0a表示一个Method信息， 00 06 和 00 15（21）表示它引用了常量池中#6 和#21项来获得这个方法的【所属类】和【方法名】

0000000 ca fe ba be 00 00 00 34 00 23 **0a 00 06 00 15** 09



第#2项09表示一个Field信息， 00 16（22）和 00 17（23）表示它引用了常量池中#22 和 #23项来获得这个成员变量的【所属类】和【成员变量名】

 0000000 ca fe ba be 00 00 00 34 00 23 **0a 00 06 00 15** 09

0000020 00 16 00 17 08 00 18 0a 00 19 00 1a 07 00 1b 07

......

### 1.4 访问标识与继承信息

![image-20220328094521042](https://s2.loli.net/2022/03/28/BwJSpvsh5jkz6ug.png)

### 1.5 Field信息

![image-20220328094743471](https://s2.loli.net/2022/03/28/zvXGoC6xbrDgu4S.png)

### 1.6 方法信息

![image-20220328094945253](https://s2.loli.net/2022/03/28/mB62LzUqpbio9QH.png)

![image-20220328095051596](https://s2.loli.net/2022/03/28/OdHqzXcbrjTpkto.png)



### 1.7 附加属性

![image-20220328095956534](https://s2.loli.net/2022/03/28/TIx5CBDqsNmZ7hp.png)



具体类文件结构详情参考

https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html



## 2. 字节码指令

### 2.1 **javap 工具**

使用javap工具来反编译class文件，分析类文件结构

```java
javap -v F:\Thread_study\src\com\nyima\JVM\day01\Main.class
```

```java
F:\Thread_study>javap -v F:\Thread_study\src\com\nyima\JVM\day5\Demo1.class
Classfile /F:/Thread_study/src/com/nyima/JVM/day5/Demo1.class
  Last modified 2020-6-6; size 434 bytes
  MD5 checksum df1dce65bf6fb0b4c1de318051f4a67e
  Compiled from "Demo1.java"
public class com.nyima.JVM.day5.Demo1
  minor version: 0
  major version: 52
  flags: ACC_PUBLIC, ACC_SUPER
Constant pool:
   #1 = Methodref          #6.#15         // java/lang/Object."<init>":()V
   #2 = Fieldref           #16.#17        // java/lang/System.out:Ljava/io/PrintStream;
   #3 = String             #18            // hello world
   #4 = Methodref          #19.#20        // java/io/PrintStream.println:(Ljava/lang/String;)V
   #5 = Class              #21            // com/nyima/JVM/day5/Demo1
   #6 = Class              #22            // java/lang/Object
   #7 = Utf8               <init>
   #8 = Utf8               ()V
   #9 = Utf8               Code
  #10 = Utf8               LineNumberTable
  #11 = Utf8               main
  #12 = Utf8               ([Ljava/lang/String;)V
  #13 = Utf8               SourceFile
  #14 = Utf8               Demo1.java
  #15 = NameAndType        #7:#8          // "<init>":()V
  #16 = Class              #23            // java/lang/System
  #17 = NameAndType        #24:#25        // out:Ljava/io/PrintStream;
  #18 = Utf8               hello world
  #19 = Class              #26            // java/io/PrintStream
  #20 = NameAndType        #27:#28        // println:(Ljava/lang/String;)V
  #21 = Utf8               com/nyima/JVM/day5/Demo1
  #22 = Utf8               java/lang/Object
  #23 = Utf8               java/lang/System
  #24 = Utf8               out
  #25 = Utf8               Ljava/io/PrintStream;
  #26 = Utf8               java/io/PrintStream
  #27 = Utf8               println
  #28 = Utf8               (Ljava/lang/String;)V
{
  public com.nyima.JVM.day5.Demo1();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: invokespecial #1                  // Method java/lang/Object."<init>":()V
         4: return
      LineNumberTable:
        line 7: 0

  public static void main(java.lang.String[]);
    descriptor: ([Ljava/lang/String;)V
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
      stack=2, locals=1, args_size=1
         0: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;
         3: ldc           #3                  // String hello world
         5: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V

         8: return
      LineNumberTable:
        line 9: 0
        line 10: 8
}
```

### 2.2 图解方法执行流程

```java
public class Demo3_1 {    
	public static void main(String[] args) {        
		int a = 10;        
		int b = Short.MAX_VALUE + 1;        
		int c = a + b;        
		System.out.println(c);   
    } 
}
```

**常量池载入运行时常量池**

常量池也属于方法区，只不过这里单独提出来了

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151317.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151317.png)

**方法字节码载入方法区**

main线程开始运行，分配栈内存

（stack=2，locals=4） 对应操作数栈有2个空间（每个空间4个字节），局部变量表中有4个槽位

[![img](https://s2.loli.net/2022/03/29/IioYcEbJPHRfkxj.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151325.png)

**执行引擎开始执行字节码**

**bipush 10**

- 将一个 byte 压入操作数栈

  （其长度会补齐 4 个字节），类似的指令还有

  - sipush 将一个 short 压入操作数栈（其长度会补齐 4 个字节）
  - ldc 将一个 int 压入操作数栈
  - ldc2_w 将一个 long 压入操作数栈（**分两次压入**，因为 long 是 8 个字节）
  - 这里小的数字都是和字节码指令存在一起，**超过 short 范围的数字存入了常量池**''

[![img](https://s2.loli.net/2022/03/29/VjQtWhA4M2rCILl.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151336.png)

**istore 1**

将操作数栈栈顶元素弹出，放入局部变量表的slot 1中

对应代码中的

a = 10

[![img](https://s2.loli.net/2022/03/29/yDlTp8UYJWN2waA.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151346.png)

[![img](https://s2.loli.net/2022/03/29/SYePFI9CoqTH1B2.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151412.png)

**ldc #3**

读取运行时常量池中#3，即32768(超过short最大值范围的数会被放到运行时常量池中)，将其加载到操作数栈中

注意 Short.MAX_VALUE 是 32767，所以 32768 = Short.MAX_VALUE + 1 实际是在编译期间计算好的

[![img](https://s2.loli.net/2022/03/29/lXOYFQynvTwEKe9.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151421.png)

**istore 2**

将操作数栈中的元素弹出，放到局部变量表的2号位置

[![img](https://s2.loli.net/2022/03/29/GmI4ybLaS3QPnpU.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151432.png)

[![img](https://s2.loli.net/2022/03/29/mBfGoiUN2YPRIL6.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151441.png)

**iload1 iload2**

将局部变量表中1号位置和2号位置的元素放入操作数栈中

- 因为只能在操作数栈中执行运算操作

[![img](https://s2.loli.net/2022/03/29/aLKzsNuwSFvRP2g.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151450.png)

[![img](https://s2.loli.net/2022/03/29/PDNGgScofRjhim8.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151459.png)

**iadd**

将操作数栈中的两个元素**弹出栈**并相加，结果在压入操作数栈中

[![img](https://s2.loli.net/2022/03/29/OHL47cUFZK8u1om.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151508.png)

[![img](https://s2.loli.net/2022/03/29/fRxcMbgDWEd3K2Z.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151523.png)

**istore 3**

将操作数栈中的元素弹出，放入局部变量表的3号位置

[![img](https://s2.loli.net/2022/03/29/PoZAkKd9H6zOXga.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151547.png)

[![img](https://s2.loli.net/2022/03/29/8PXfeTmsKO59QA3.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151555.png)

**getstatic #4**

在运行时常量池中找到#4，发现是一个对象

在堆内存中找到该对象，并将其**引用**放入操作数栈中

[![img](https://s2.loli.net/2022/03/29/2ItFxk4KaNOVBum.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151605.png)

[![img](https://s2.loli.net/2022/03/29/qEDaoZcVsH46tlg.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151613.png)

**iload 3**

将局部变量表中3号位置的元素压入操作数栈中

[![img](https://s2.loli.net/2022/03/29/aG1Ei4rgxRpwQJ3.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151624.png)

**invokevirtual 5**

找到常量池 #5 项，定位到方法区 java/io/PrintStream.println:(I)V 方法

生成新的栈帧（分配 locals、stack等）

传递参数，执行新栈帧中的字节码

[![img](https://s2.loli.net/2022/03/29/9qjgLXCFlb1BfzW.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151632.png)

执行完毕，弹出栈帧

清除 main 操作数栈内容

![image-20220329100602246](https://s2.loli.net/2022/03/29/NV1KdUqD64t8pvS.png)

**return**
完成 main 方法调用，弹出 main 栈帧，程序结束

### 2.3 条件判断指令

![image-20220329103041678](https://s2.loli.net/2022/03/29/ePa7IxYhrignp1E.png)

- byte，short,char都会按int比较，操作数栈都是4字节

- goto用来进行跳转到指定行号的字节码

  ```java
  public class Demo_1 {
      public static void main(String[] args) {
          int a = 0;
          if(a==0){
              a=10;
          }else{
              a=20;
          }
      }
  }
  ```

  ```java
  Code:
        stack=1, locals=2, args_size=1
           0: iconst_0//（-1~5 ：iconst）常量0放入操作数栈
           1: istore_1//存入局部变量表
           2: iload_1//放入操作数栈
           3: ifne          12 //如果ifne成立，跳转到12行
           6: bipush        10//压入操作数栈
           8: istore_1		//存入局部变量表
           9: goto          15 //跳转到15行
          12: bipush        20 //操作数栈压入20
          14: istore_1
          15: return
  ```

### 2.4 循环控制指令

```JAVA
public class Demo_1 {
    public static void main(String[] args) {
        int a = 0;
        while(a<10){
            a++;
        }
    }
}

 Code:
      stack=2, locals=2, args_size=1
         0: iconst_0
         1: istore_1
         2: iload_1
         3: bipush        10
         5: if_icmpge     14
         8: iinc          1, 1
        11: goto          2
        14: return
```



### 2.5 通过字节码指令分析问题

```java
public class Demo2 {
	public static void main(String[] args) {
		int i=0;
		int x=0;
		while(i<10) {
			x = x++;
			i++;
		}
		System.out.println(x); //结果为0
	}
}
```

为什么最终的x结果为0呢？ 通过分析字节码指令即可知晓

- iinc指令是直接在局部变量slot上进行运算

- a++和++a的区别是先执行iload还是先执行iinc

```java
Code:
     stack=2, locals=3, args_size=1	//操作数栈分配2个空间，局部变量表分配3个空间
        0: iconst_0	//准备一个常数0
        1: istore_1	//将常数0放入局部变量表的1号槽位 i=0
        2: iconst_0	//准备一个常数0
        3: istore_2	//将常数0放入局部变量的2号槽位 x=0	
        4: iload_1		//将局部变量表1号槽位的数放入操作数栈中
        5: bipush        10	//将数字10放入操作数栈中，此时操作数栈中有2个数
        7: if_icmpge     21	//比较操作数栈中的两个数，如果下面的数大于上面的数，就跳转到21。这里的比较是将两个数做减法。因为涉及运算操作，所以会将两个数弹出操作数栈来进行运算。运算结束后操作数栈为空
       10: iload_2		//将局部变量2号槽位的数放入操作数栈中，放入的值是0
       11: iinc          2(槽位), 1（增几）	//将局部变量2号槽位的数加1，自增后，槽位中的值为1
       14: istore_2	//将操作数栈中的数放入到局部变量表的2号槽位，2号槽位的值又变为了0
       15: iinc          1, 1 //1号槽位的值自增1
       18: goto          4 //跳转到第4条指令
       21: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;
       24: iload_2
       25: invokevirtual #3                  // Method java/io/PrintStream.println:(I)V
       28: return
```

### 2.6 init

```java
public class Demo4 {
	private String a = "s1";

	{
		b = 20;
	}

	private int b = 10;

	{
		a = "s2";
	}

	public Demo4(String a, int b) {
		this.a = a;
		this.b = b;
	}

	public static void main(String[] args) {
		Demo4 d = new Demo4("s3", 30);
		System.out.println(d.a);
		System.out.println(d.b);
	}
}


Code:
     stack=2, locals=3, args_size=3
        0: aload_0
        1: invokespecial #1                  // Method java/lang/Object."<init>":()V
        4: aload_0
        5: ldc           #2                  // String s1
        7: putfield      #3                  // Field a:Ljava/lang/String;
       10: aload_0
       11: bipush        20
       13: putfield      #4                  // Field b:I
       16: aload_0
       17: bipush        10
       19: putfield      #4                  // Field b:I
       22: aload_0
       23: ldc           #5                  // String s2
       25: putfield      #3                  // Field a:Ljava/lang/String;
       //原始构造方法在最后执行
       28: aload_0
       29: aload_1
       30: putfield      #3                  // Field a:Ljava/lang/String;
       33: aload_0
       34: iload_2
       35: putfield      #4                  // Field b:I
       38: return
```

### 2.7 方法调用

```java
public class Demo_1 {
    public Demo_1() {

    }

    private void test1() {

    }

    private final void test2() {

    }

    public void test3() {

    }

    public static void test4() {

    }

    public static void main(String[] args) {
        Demo_1 demo_1 = new Demo_1();
        demo_1.test1();
        demo_1.test2();
        demo_1.test3();
        demo_1.test4();
        Demo_1.test4();
    }
}
```

不同方法在调用时，对应的虚拟机指令有所区别

- 私有、构造、被final修饰的方法，在调用时都使用**invokespecial**指令
- 普通成员方法在调用时，使用invokevirtual指令。因为编译期间无法确定该方法的内容，只有在运行期间才能确定
- 静态方法在调用时使用invokestatic指令

```java
 Code:
      stack=2, locals=2, args_size=1
         0: new           #2                  // class Demo_1
         3: dup
         4: invokespecial #3                  // Method "<init>":()V
         7: astore_1
         8: aload_1
         9: invokespecial #4                  // Method test1:()V
        12: aload_1
        13: invokespecial #5                  // Method test2:()V
        16: aload_1
        17: invokevirtual #6                  // Method test3:()V
        20: aload_1							  
        21: pop								  //test4静态方法不需要对象调用，相当于多执行了两条废弃指令
            								  //所以不要使用对象来调用静态了，会产生不必要的指令
        22: invokestatic  #7                  // Method test4:()V
        25: invokestatic  #7                  // Method test4:()V
        28: return

```

- new 是创建【对象】，给对象分配堆内存，执行成功会将【**对象引用**】压入操作数栈
- dup 是赋值操作数栈栈顶的内容，本例即为【**对象引用**】，为什么需要两份引用呢，一个是要配合 invokespecial 调用该对象的构造方法 “init”:()V （会消耗掉栈顶一个引用），另一个要 配合 astore_1 赋值给局部变量
- 终方法（ﬁnal），私有方法（private），构造方法都是由 invokespecial 指令来调用，属于静态绑定
- 普通成员方法是由 invokevirtual 调用，属于**动态绑定**，即支持多态 成员方法与静态方法调用的另一个区别是，执行方法前是否需要【对象引用

### 2.8 多态的原理

因为普通成员方法需要在运行时才能确定具体的内容，所以虚拟机需要调用**invokevirtual**指令

在执行invokevirtual指令时，经历了以下几个步骤

- 先通过栈帧中对象的引用找到对象
- 分析对象头，找到对象实际的Class
- Class结构中有**vtable**
- 查询vtable找到方法的具体地址
- 执行方法的字节码

### 2.9 异常处理

try-catch

```java
public class Demo1 {
	public static void main(String[] args) {
		int i = 0;
		try {
			i = 10;
		}catch (Exception e) {
			i = 20;
		}
	}
}
```

对应字节码指令

```java
Code:
     stack=1, locals=3, args_size=1
        0: iconst_0
        1: istore_1
        2: bipush        10
        4: istore_1
        5: goto          12
        8: astore_2
        9: bipush        20
       11: istore_1
       12: return
     //多出来一个异常表
     Exception table:
        from    to  	target 		type
            2     5(不包含5)     8   Class java/lang/Exception
```

- 可以看到多出来一个 Exception table 的结构，[from, to) 是**前闭后开**（也就是检测2~4行）的检测范围，一旦这个范围内的字节码执行出现异常，则通过 type 匹配异常类型，如果一致，进入 target 所指示行号
- 8行的字节码指令 astore_2 是将**异常对象引用存入**局部变量表的2号位置（为e）

多个single-catch

```java
public class Demo1 {
	public static void main(String[] args) {
		int i = 0;
		try {
			i = 10;
		}catch (ArithmeticException e) {
			i = 20;
		}catch (Exception e) {
			i = 30;
		}
	}
}

Code:
     stack=1, locals=3, args_size=1
        0: iconst_0
        1: istore_1
        2: bipush        10
        4: istore_1
        5: goto          19
        8: astore_2
        9: bipush        20
       11: istore_1
       12: goto          19
       15: astore_2
       16: bipush        30
       18: istore_1
       19: return
     Exception table:
        from    to  target type
            2     5     8   Class java/lang/ArithmeticException
            2     5    15   Class java/lang/Exception
```

- 因为异常出现时，**只能进入** Exception table 中**一个分支**，所以局部变量表 slot 2 位置**被共用**

#### finally

```java
public class Demo2 {
	public static void main(String[] args) {
		int i = 0;
		try {
			i = 10;
		} catch (Exception e) {
			i = 20;
		} finally {
			i = 30;
		}
	}
}


Code:
     stack=1, locals=4, args_size=1
        0: iconst_0
        1: istore_1
        //try块
        2: bipush        10
        4: istore_1
        //try块执行完后，会执行finally    
        5: bipush        30
        7: istore_1
        8: goto          27
       //catch块     
       11: astore_2 //异常信息放入局部变量表的2号槽位
       12: bipush        20
       14: istore_1
       //catch块执行完后，会执行finally        
       15: bipush        30
       17: istore_1
       18: goto          27
       //出现异常，但未被Exception捕获，会抛出其他异常，这时也需要执行finally块中的代码   
       21: astore_3
       22: bipush        30
       24: istore_1
       25: aload_3
       26: athrow  //抛出异常
       27: return
     Exception table:
        from    to  target type
            2     5    11   Class java/lang/Exception
            2     5    21   any
           11    15    21   any
```

可以看到 ﬁnally 中的代码被**复制了 3 份**，分别**放入 try 流程，catch 流程以及 catch剩余的异常类型流程**

**注意**：虽然从字节码指令看来，每个块中都有finally块，但是finally块中的代码**只会被执行一次**

**finally块中的代码一定会被执行**

#### **finally中的return**

```java
public class Demo_1 {
    public static void main(String[] args) {
        int result = Demo_1.test();
        System.out.println(result);
    }

    public static int test() {
        try {
            return 10;
        } finally {
            return 20;
        }
    }
}

Code:
      stack=1, locals=2, args_size=0
         0: bipush        10 //10压入栈顶
         2: istore_0		//10->slot 0 从栈顶移除
         3: bipush        20 //20压入栈顶
         5: ireturn			//返回栈顶 int(20)
         6: astore_1		//catch any->slot 1
         7: bipush        20	//20放入栈顶
         9: ireturn				//返回栈顶int(20)
      Exception table:
         from    to  target type
             0     3     6   any
```

- 由于 ﬁnally 中的 **ireturn** 被插入了所有可能的流程，因此**返回结果肯定以ﬁnally的为准**
- 至于字节码中第 2 行，似乎没啥用，且留个伏笔，看下个例子
- 跟上例中的 ﬁnally 相比，发现**没有 athrow 了**，这告诉我们：如果在 ﬁnally 中出现了 return，会**吞掉异常**
- 所以**不要在finally中进行返回操作**

```java
public class Demo_1 {
    public static void main(String[] args) {
        int result = Demo_1.test();
        System.out.println(result);
    }

    public static int test() {
        int i=10;
        try {
            return i;
        } finally {
            i=20;
        }
    }
}

Code:
      stack=1, locals=3, args_size=0
         0: bipush        10 //入栈
         2: istore_0		//10—> slot 0 (i)
         3: iload_0			//slot 0->栈
         4: istore_1		//10->slot 1,暂存至slot 1,目的是为了固定返回值
         5: bipush        20 //20-》栈
         7: istore_0		//栈-》slot 0(i)
         8: iload_1			//slot 1 (10)载入slot 1 暂存的值
         9: ireturn			//返回栈顶int(10)
        10: astore_2
        11: bipush        20
        13: istore_0
        14: aload_2
        15: athrow
```

### 2.10 synchronized

```java
public class Demo_1 {
    public static void main(String[] args) {
        Object lock = new Object();
        synchronized (lock){
            System.out.println("ok");
        }
    }
}
Code:
      stack=2, locals=4, args_size=1
         0: new           #2                  // class java/lang/Object
         3: dup								  // 对象引用放入操作数栈，所以需要复制一份，用两次
         4: invokespecial #1                  // Method java/lang/Object."<init>":()V  第一次消耗，调用构造方法
         7: astore_1						  // lock引用-》lock slot 1
         8: aload_1							  //加载到操作数栈，syn开始
         9: dup								  //复制，1：monitorenter(加锁用), 2.monitorexit（解锁用）
        10: astore_2						  //lock引用 -》slot 2
        11: monitorenter					  //对lock引用所指向对象进行加锁
          //锁住后代码块中的操作  
        12: getstatic     #3                  // Field java/lang/System.out:Ljava/io/PrintStream;
        15: ldc           #4                  // String ok
        17: invokevirtual #5                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
        //若没有catch异常
        20: aload_2							  //加载slot2(引用)到操作数栈
        21: monitorexit						  //解锁
        22: goto          30
         //异常操作
        25: astore_3
        26: aload_2
        27: monitorexit
        28: aload_3
        29: athrow
        30: return
 Exception table:
         from    to  target type
            12    22    25   any
            25    28    25   any
```



## 3. 编译期处理

所谓的 **语法糖** ，其实就是指 java 编译器把 *.java 源码编译为 \*.class 字节码的过程中，**自动生成**和**转换**的一些代码，主要是为了减轻程序员的负担，算是 java 编译器给我们的一个额外福利

**注意**，以下代码的分析，借助了 javap 工具，idea 的反编译功能，idea 插件 jclasslib 等工具。另外， 编译器转换的**结果直接就是 class 字节码**，只是为了便于阅读，给出了 几乎等价 的 java 源码方式，并不是编译器还会转换出中间的 java 源码，切记。



#### 3.1 默认构造函数

```java
public class Candy1 {

}

经过编译期优化后
public class Candy1 {
   //这个无参构造器是java编译器帮我们加上的
   public Candy1() {
      //即调用父类 Object 的无参构造方法，即调用 java/lang/Object." <init>":()V
      super();
   }
}
```

#### 3.2 自动拆装箱

**基本类型(int)**和**其包装类型(Integer)**的**相互转换**过程，称为拆装箱

在JDK 5以后，它们的转换可以在**编译期自动完成**

```java
public class Demo2 {
   public static void main(String[] args) {
      Integer x = 1;
      int y = x;
   }
}


public class Demo2 {
   public static void main(String[] args) {
      //基本类型赋值给包装类型，称为装箱
      Integer x = Integer.valueOf(1);
      //包装类型赋值给基本类型，称谓拆箱
      int y = x.intValue();
   }
}
```

#### 3.3 泛型集合取值

Java 泛型擦除是 Java 泛型中的一个重要特性，是指Java在编译期间，所有的泛型信息都会被擦掉，其目的是避免过多的创建类而造成的运行时的过度消耗。

泛型也是在 JDK 5 开始加入的特性，但 java 在**编译泛型代码后**会执行 **泛型擦除** 的动作，即泛型信息在编译为字节码之后就**丢失**了，实际的类型都当做了 **Object** 类型来处理：

```java
public class Demo3 {
   public static void main(String[] args) {
      List<Integer> list = new ArrayList<>();
      list.add(10); //实际调用的是List.add(Object e)
      Integer x = list.get(0);
   }
}
```

对应字节码

```java
Code:
    stack=2, locals=3, args_size=1
       0: new           #2                  // class java/util/ArrayList
       3: dup
       4: invokespecial #3                  // Method java/util/ArrayList."<init>":()V
       7: astore_1							//list->slot 1
       8: aload_1
       9: bipush        10					//栈 10
      11: invokestatic  #4                  // Method java/lang/Integer.valueOf:(I)Ljava/lang/Integer; 基本类型变包装
      //这里进行了泛型擦除，实际调用的是add(Objcet o)
      14: invokeinterface #5,  2            // InterfaceMethod java/util/List.add:(Ljava/lang/Object;)Z 统一当成object

      19: pop
      20: aload_1
      21: iconst_0
      //这里也进行了泛型擦除，实际调用的是get(Object o)   
      22: invokeinterface #6,  2            // InterfaceMethod java/util/List.get:(I)Ljava/lang/Object;
//这里进行了类型转换，将Object转换成了Integer
      27: checkcast     #7                  // class java/lang/Integer 类型转换
      30: astore_2
      31: return
```

所以调用get函数取值时，有一个类型转换的操作

```java
Integer x = (Integer) list.get(0);
```

如果要将返回结果赋值给一个int类型的变量，则还有**自动拆箱**的操作

```java
int x = (Integer) list.get(0).intValue();
```



#### 3.4 可变参数

```java
public class Demo4 {
   public static void foo(String... args) {
      //将args赋值给arr，可以看出String...实际就是String[] 
      String[] arr = args;
      System.out.println(arr.length);
   }

   public static void main(String[] args) {
      foo("hello", "world");
   }
}
```

可变参数 **String…** args 其实是一个 **String[]** args ，从代码中的赋值语句中就可以看出来。 同 样 java 编译器会在编译期间将上述代码变换为：

```java
public class Demo4 {
   public Demo4 {}

    
   public static void foo(String[] args) {
      String[] arr = args;
      System.out.println(arr.length);
   }

   public static void main(String[] args) {
      foo(new String[]{"hello", "world"});
   }
}
```

注意，如果调用的是foo()，即未传递参数时，等价代码为foo(new String[]{})，**创建了一个空数组**，而不是直接传递的null

#### 3.5 foreach循环

```java
public class Demo5 {
	public static void main(String[] args) {
        //数组赋初值的简化写法也是一种语法糖。
		int[] arr = {1, 2, 3, 4, 5};
		for(int x : arr) {
			System.out.println(x);
		}
	}
}

public class Demo5 {
    public Demo5 {}

	public static void main(String[] args) {
		int[] arr = new int[]{1, 2, 3, 4, 5};
		for(int i=0; i<arr.length; ++i) {
			int x = arr[i];
			System.out.println(x);
		}
	}
}
```

**如果是集合使用foreach**

```java
public class Demo5 {
   public static void main(String[] args) {
      List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
      for (Integer x : list) {
         System.out.println(x);
      }
   }
}
```

集合要使用foreach，需要该集合类实现了**Iterable接口**，因为集合的遍历需要用到**迭代器Iterator**

```java
public class Demo5 {
    public Demo5 {}
    
   public static void main(String[] args) {
      List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
      //获得该集合的迭代器
      Iterator<Integer> iterator = list.iterator();
      while(iterator.hasNext()) {
         Integer x = iterator.next();
         System.out.println(x);
      }
   }
}
```

#### 3.6 switch 字符串

```java
public class Demo6 {
   public static void main(String[] args) {
      String str = "hello";
      switch (str) {
         case "hello" :
            System.out.println("h");
            break;
         case "world" :
            System.out.println("w");
            break;
         default:
            break;
      }
   }
}
```

在编译器中执行的操作

```java
public class Demo6 {
   public Demo6() {
      
   }
   public static void main(String[] args) {
      String str = "hello";
      int x = -1;
      //通过字符串的hashCode+value来判断是否匹配
      switch (str.hashCode()) {
         //hello的hashCode
         case 99162322 :
            //再次比较，因为字符串的hashCode有可能相等
            if(str.equals("hello")) {
               x = 0;
            }
            break;
         //world的hashCode
         case 11331880 :
            if(str.equals("world")) {
               x = 1;
            }
            break;
         default:
            break;
      }

      //用第二个switch在进行输出判断
      switch (x) {
         case 0:
            System.out.println("h");
            break;
         case 1:
            System.out.println("w");
            break;
         default:
            break;
      }
   }
}
```

过程说明：

- 在编译期间，单个的switch被分为了两个
  - 第一个用来匹配字符串，并给x赋值
    - 字符串的匹配用到了字符串的hashCode，还用到了equals方法
    - 使用hashCode是为了提高比较效率,减少比较次数，使用equals是防止有hashCode冲突（如BM和C.）
  - 第二个用来根据x的值来决定输出语句

#### 3.7 枚举

```java
public class Demo7 {
   public static void main(String[] args) {
      SEX sex = SEX.MALE;
      switch (sex) {
         case MALE:
            System.out.println("man");
            break;
         case FEMALE:
            System.out.println("woman");
            break;
         default:
            break;
      }
   }
}

enum SEX {
   MALE, FEMALE;
}
```

编译器中执行的代码如下

```java
public class Demo7 {
   /**     
    * 定义一个合成类（仅 jvm 使用，对我们不可见）     
    * 用来映射枚举的 ordinal 与数组元素的关系     
    * 枚举的 ordinal 表示枚举对象的序号，从 0 开始     
    * 即 MALE 的 ordinal()=0，FEMALE 的 ordinal()=1     
    */ 
   static class $MAP {
      //数组大小即为枚举元素个数，里面存放了case用于比较的数字
      static int[] map = new int[2];
      static {
         //ordinal即枚举元素对应所在的位置，MALE为0，FEMALE为1
         map[SEX.MALE.ordinal()] = 1;
         map[SEX.FEMALE.ordinal()] = 2;
      }
   }

   public static void main(String[] args) {
      SEX sex = SEX.MALE;
      //将对应位置枚举元素的值赋给x，用于case操作
      int x = $MAP.map[sex.ordinal()];
      switch (x) {
         case 1:
            System.out.println("man");
            break;
         case 2:
            System.out.println("woman");
            break;
         default:
            break;
      }
   }
}

enum SEX {
   MALE, FEMALE;
}
```

枚举类

```java
enum SEX {
   MALE, FEMALE;
}

public final class Sex extends Enum<Sex> {   
   //对应枚举类中的元素
   public static final Sex MALE;    
   public static final Sex FEMALE;    
   private static final Sex[] $VALUES;
   
    static {       
    	//调用构造函数，传入枚举元素的值及ordinal
    	MALE = new Sex("MALE", 0);    
        FEMALE = new Sex("FEMALE", 1);   
        $VALUES = new Sex[]{MALE, FEMALE}; 
   }
 	
   //调用父类中的方法
    private Sex(String name, int ordinal) {     
        super(name, ordinal);    
    }
   
    public static Sex[] values() {  
        return $VALUES.clone();  
    }
    public static Sex valueOf(String name) { 
        return Enum.valueOf(Sex.class, name);  
    } 
   
}
```

#### 3.8 try-with-resources

JDK7 开始新增了对需要关闭的资源处理的特殊语法：try-with-resources:

```java
try(资源变量=创建资源对象){
    
}catch(){
    
}
```

其中资源对象需要实现**AutoCloseable**接口，例如InputStream、OuputStream、Connection等接口都实现了AutoCloseable,使用try-with-resources可以**不用写finally语句块**，编译器会帮助**生成关闭资源代码**

```java
public class Candy9{
	public static void main(String[] args){
        try(InputStream is = new FileInputStream("d:\\1.txt")){
            sout(is);
        }catch(IOException e){
            e.printStack();
        }
    }

}
```

![image-20220330092135632](https://s2.loli.net/2022/03/30/Eq5mPzNtfvUJncH.png)



## 4. 类加载阶段

### 4.1 加载

1. 通过全限定类名来获取定义此类的二进制字节流。
2. 将这个字节流所代表的静态存储结构转化为**方法区的运行时数据结构**。
3. 在本地内存（堆）中生成一个代表这个类的 **java.lang.Class 对象**，作为**方法区**这个类的各种数据的**访问入口**。

- 将类的字节码载入方法区（1.8后为元空间，在本地内存中）中，内部采用 C++ 的 instanceKlass 描述 java 类，它的重要 ﬁeld 有：
  - _java_mirror 即 java 的类镜像，例如对 String 来说，它的镜像类就是 String.class，作用是把Klass 暴露给 java 使用（C++数据结构与java的桥梁，互相持有对方的指针地址），作为方法区这个类的各种数据的访问入口
  - _super 即父类
  - _ﬁelds 即成员变量
  - _methods 即方法
  - _constants 即常量池
  - _class_loader 即类加载器
  - _vtable 虚方法表
  - _itable 接口方法
- 如果这个类还有父类没有加载，**先加载父类**
- 加载和链接可能是**交替运行**的

![img](https://s2.loli.net/2022/03/31/Pns4VaFe97UqCE5.png)

如果想通过对象获取class信息，先访问对象头通过地址找到类对象，通过类对象去元空间找到instaceKlass。

因此如果想调用get、set方法是去元空间中获得field、method等具体信息。

- instanceKlass保存在**方法区**。JDK 8以后，方法区位于元空间中，而元空间又位于本地内存中
- _java_mirror则是保存在**堆内存**中
- InstanceKlass和*.class(JAVA镜像类)互相保存了对方的地址
- 类的对象在对象头中保存了*.class的地址。让对象可以通过其找到方法区中的instanceKlass，从而获取类的各种信息

### 4.2 链接

##### 验证

验证类是否符合 JVM规范，安全性检查（如魔数、主次版本号等等）

##### 准备

为**类变量（被static修饰的变量）**，而不包括实例变量（实例化时分配在堆中）分配内存并设置类变量初始值，这些变量所使用的内存都将在方法区中进行分配。

- static变量在JDK 7以前是存储与instanceKlass末尾。但在JDK 7以后就存储在_java_mirror末尾了
- static变量在分配空间和赋值是在两个阶段完成的。分配空间在准备阶段完成，赋值在初始化阶段完成
- 如果 static 变量是 ﬁnal 的**基本类型**，以及**字符串常量**，那么编译阶段值就确定了，**赋值在准备阶段完成**
- 如果 static 变量是 ﬁnal 的，但属于**引用类型**，那么赋值也会在**初始化阶段完成**

##### 解析

将常量池中的符号引用解析为直接引用

### 4.3 初始化

到初始化阶段，才真正开始执行类中定义的 Java 程序代码，初始化阶段就是**执行类构造器clinit()方法的过程**，虚拟机会保证这个类的『构造方法』的线程安全

- clinit()方法是由编译器自动收集类中的所有类变量的**赋值动作和静态语句块**（static{}块）中的语句合并产生的

**注意**

编译器收集的顺序是由语句在源文件中**出现的顺序决定**的，静态语句块中只能访问到定义在静态语句块之前的变量，定义在它**之后**的变量，在前面的静态语句块**可以赋值，但是不能访问**，如

[![img](https://s2.loli.net/2022/03/31/URQXq8zHemi5LOv.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201118204542.png)

##### 发生时机

**类的初始化的懒惰的**，以下情况会初始化

- main 方法所在的类，总会被首先初始化
- 首次访问这个类的静态变量或静态方法时
- 子类初始化，如果父类还没初始化，会引发
- 子类访问父类的静态变量，只会触发父类的初始化
- Class.forName
- new 会导致初始化

以下情况不会初始化

- 访问类的 static ﬁnal 静态常量（基本类型和字符串）
- 类对象.class 不会触发初始化
- 创建该类对象的数组
- 类加载器的.loadClass方法
- Class.forName的参数2为false时

**验证类是否被初始化，可以看改类的静态代码块是否被执行**



## 5. 类加载器

Java虚拟机设计团队有意把类加载阶段中的**“通过一个类的全限定名来获取描述该类的二进制字节流”**这个动作放到Java虚拟机外部去实现，以便让应用程序自己决定如何去获取所需的类。实现这个动作的代码被称为**“类加载器”**（ClassLoader）

以JDK 8为例

| 名称                                      | 加载的类              | 说明                            |
| ----------------------------------------- | --------------------- | ------------------------------- |
| Bootstrap ClassLoader（启动类加载器）     | JAVA_HOME/jre/lib     | 无法直接访问                    |
| Extension ClassLoader(拓展类加载器)       | JAVA_HOME/jre/lib/ext | 上级为Bootstrap，**显示为null** |
| Application ClassLoader(应用程序类加载器) | classpath             | 上级为Extension                 |
| 自定义类加载器                            | 自定义                | 上级为Application               |

#### 启动类加载器

可通过在控制台输入指令，使得类被启动类加器加载

该类加载器用c、c++编写，用java无法看到内部结构

#### 拓展类加载器

如果classpath和JAVA_HOME/jre/lib/ext 下有同名类，加载时会使用**拓展类加载器**加载。当应用程序类加载器发现拓展类加载器已将该同名类加载过了，则不会再次加载

#### 双亲委派模式

双亲委派模式，即调用类加载器ClassLoader 的 loadClass 方法时，查找类的规则

当某个类加载器需要加载某个`.class`文件时，它首先把这个任务委托给他的上级类加载器，递归这个操作，如果上级的类加载器没有加载，自己才会去加载这个类。

更偏向于组合关系而不是继承关系

```java
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException
{
    synchronized (getClassLoadingLock(name)) {
        // 首先查找该类是否已经被该类加载器加载过了
        Class<?> c = findLoadedClass(name);
        //如果没有被加载过
        if (c == null) {
            long t0 = System.nanoTime();
            try {
                //看是否被它的上级加载器加载过了 Extension的上级是Bootstarp，但它显示为null
                if (parent != null) {
                    c = parent.loadClass(name, false);
                } else {
                    //看是否被启动类加载器加载过
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // ClassNotFoundException thrown if class not found
                // from the non-null parent class loader
                //捕获异常，但不做任何处理
            }

            if (c == null) {
                //如果还是没有找到，先让拓展类加载器调用findClass方法去找到该类，如果还是没找到，就抛出异常
                //然后让应用类加载器去找classpath下找该类
                long t1 = System.nanoTime();
                c = findClass(name);

                // 记录时间
                sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                sun.misc.PerfCounter.getFindClasses().increment();
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

#### 自定义类加载器

##### 使用场景

- 想加载非 classpath 随意路径中的类文件
- 通过接口来使用实现，希望解耦时，常用在框架设计
- 这些类希望予以隔离，不同应用的同名类都可以加载，不冲突，常见于 tomcat 容器

##### 步骤

- 继承ClassLoader父类
- 要遵从双亲委派机制，重写 ﬁndClass 方法
  - 不是重写loadClass方法，否则不会走双亲委派机制
- 读取类文件的字节码
- 调用父类的 deﬁneClass 方法来加载类
- 使用者调用该类加载器的 loadClass 方法

#### 破坏双亲委派模式

- 双亲委派模型的第一次“被破坏”其实发生在双亲委派模型出现之前——即JDK1.2面世以前的“远古”时代
  - 建议用户重写findClass()方法，在类加载器中的loadClass()方法中也会调用该方法
- 双亲委派模型的第二次“被破坏”是由这个模型自身的缺陷导致的
  - 如果有基础类型又要调用回用户的代码，此时也会破坏双亲委派模式
- 双亲委派模型的第三次“被破坏”是由于用户对程序动态性的追求而导致的
  - 这里所说的“动态性”指的是一些非常“热”门的名词：代码热替换（Hot Swap）、模块热部署（Hot Deployment）等

## 6. 运行期优化

运行期间，jvm会对运行速度进行优化

### 分层编译

JVM 将执行状态分成了 5 个层次：

- 0层：解释执行，用解释器将字节码翻译为机器码
- 1层：使用 C1 **即时编译器**编译执行（不带 proﬁling）
- 2层：使用 C1 即时编译器编译执行（带基本的profiling）
- 3层：使用 C1 即时编译器编译执行（带完全的profiling）
- 4层：使用 C2 即时编译器编译执行

proﬁling 是指在运行过程中收集一些程序执行状态的数据，例如【方法的调用次数】，【循环的 回边次数】等

##### 即时编译器（JIT）与解释器的区别

- 解释器
  - 将字节码**解释**为机器码，下次即使遇到相同的字节码，仍会执行重复的解释
  - 是将字节码解释为针对所有平台都通用的机器码
- 即时编译器
  - 将一些字节码**编译**为机器码，**并存入 Code Cache**，下次遇到相同的代码，直接执行，无需再编译
  - 根据平台类型，生成平台特定的机器码

对于大部分的不常用的代码，我们无需耗费时间将其编译成机器码，而是采取解释执行的方式运行；另一方面，对于仅占据小部分的热点代码，我们则可以将其编译成机器码，以达到理想的运行速度。 执行效率上简单比较一下 Interpreter < C1 < C2，总的目标是发现热点代码（hotspot名称的由 来），并优化这些热点代码

### 逃逸分析

逃逸分析（Escape Analysis）简单来讲就是，Java Hotspot 虚拟机可以分析**新创建对象的使用范围，并决定是否在 Java 堆上分配内存**的一项技术

逃逸分析的 JVM 参数如下：

- 开启逃逸分析：-XX:+DoEscapeAnalysis
- 关闭逃逸分析：-XX:-DoEscapeAnalysis
- 显示分析结果：-XX:+PrintEscapeAnalysis

逃逸分析技术在 Java SE 6u23+ 开始支持，并默认设置为启用状态，可以不用额外加这个参数

**对象逃逸状态**

**全局逃逸（GlobalEscape）**

- 即一个对象的作用范围逃出了当前方法或者当前线程，有以下几种场景：
  - 对象是一个静态变量
  - 对象是一个已经发生逃逸的对象
  - 对象作为当前方法的返回值

**参数逃逸（ArgEscape）**

- 即一个对象被作为方法参数传递或者被参数引用，但在调用过程中不会发生全局逃逸，这个状态是通过被调方法的字节码确定的

**没有逃逸**

- 即方法中的对象没有发生逃逸

**逃逸分析优化**

针对上面第三点，当一个对象**没有逃逸**时，可以得到以下几个虚拟机的优化

### 方法内联

##### **内联函数**

内联函数就是在程序编译时，编译器**将程序中出现的内联函数的调用表达式用内联函数的函数体来直接进行替换**

##### **JVM内联函数**

C++是否为内联函数由自己决定，Java由**编译器决定**。Java不支持直接声明为内联函数的，如果想让他内联，你只能够向编译器提出请求: 关键字**final修饰** 用来指明那个函数是希望被JVM内联的，如

```
public final void doSomething() {  
        // to do something  
}Copy
```

总的来说，一般的函数都不会被当做内联函数，只有声明了final后，编译器才会考虑是不是要把你的函数变成内联函数

JVM内建有许多运行时优化。首先**短方法**更利于JVM推断。流程更明显，作用域更短，副作用也更明显。如果是长方法JVM可能直接就跪了。

第二个原因则更重要：**方法内联**

如果JVM监测到一些**小方法被频繁的执行**，它会把方法的调用替换成方法体本身，如：

```
private int add4(int x1, int x2, int x3, int x4) { 
		//这里调用了add2方法
        return add2(x1, x2) + add2(x3, x4);  
    }  

    private int add2(int x1, int x2) {  
        return x1 + x2;  
    }Copy
```

方法调用被替换后

```
private int add4(int x1, int x2, int x3, int x4) {  
    	//被替换为了方法本身
        return x1 + x2 + x3 + x4;  
    }
```

### 反射优化

```
public class Reflect1 {
   public static void foo() {
      System.out.println("foo...");
   }

   public static void main(String[] args) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
      Method foo = Demo3.class.getMethod("foo");
      for(int i = 0; i<=16; i++) {
         foo.invoke(null);
      }
   }
}Copy
```

foo.invoke 前面 0 ~ 15 次调用使用的是 MethodAccessor 的 NativeMethodAccessorImpl 实现

invoke方法源码

```
@CallerSensitive
public Object invoke(Object obj, Object... args)
    throws IllegalAccessException, IllegalArgumentException,
       InvocationTargetException
{
    if (!override) {
        if (!Reflection.quickCheckMemberAccess(clazz, modifiers)) {
            Class<?> caller = Reflection.getCallerClass();
            checkAccess(caller, clazz, obj, modifiers);
        }
    }
    //MethodAccessor是一个接口，有3个实现类，其中有一个是抽象类
    MethodAccessor ma = methodAccessor;             // read volatile
    if (ma == null) {
        ma = acquireMethodAccessor();
    }
    return ma.invoke(obj, args);
}Copy
```

[![img](https://s2.loli.net/2022/03/31/E2RBeIXJY6GLDxF.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200614133554.png)

会由DelegatingMehodAccessorImpl去调用NativeMethodAccessorImpl

NativeMethodAccessorImpl源码

```
class NativeMethodAccessorImpl extends MethodAccessorImpl {
    private final Method method;
    private DelegatingMethodAccessorImpl parent;
    private int numInvocations;

    NativeMethodAccessorImpl(Method var1) {
        this.method = var1;
    }
	
	//每次进行反射调用，会让numInvocation与ReflectionFactory.inflationThreshold的值（15）进行比较，并使使得numInvocation的值加一
	//如果numInvocation>ReflectionFactory.inflationThreshold，则会调用本地方法invoke0方法
    public Object invoke(Object var1, Object[] var2) throws IllegalArgumentException, InvocationTargetException {
        if (++this.numInvocations > ReflectionFactory.inflationThreshold() && !ReflectUtil.isVMAnonymousClass(this.method.getDeclaringClass())) {
            MethodAccessorImpl var3 = (MethodAccessorImpl)(new MethodAccessorGenerator()).generateMethod(this.method.getDeclaringClass(), this.method.getName(), this.method.getParameterTypes(), this.method.getReturnType(), this.method.getExceptionTypes(), this.method.getModifiers());
            this.parent.setDelegate(var3);
        }

        return invoke0(this.method, var1, var2);
    }

    void setParent(DelegatingMethodAccessorImpl var1) {
        this.parent = var1;
    }

    private static native Object invoke0(Method var0, Object var1, Object[] var2);
}Copy
//ReflectionFactory.inflationThreshold()方法的返回值
private static int inflationThreshold = 15;Copy
```

- 一开始if条件不满足，就会调用本地方法invoke0
- 随着numInvocation的增大，当它大于ReflectionFactory.inflationThreshold的值16时，就会本地方法访问器替换为一个运行时动态生成的访问器，来提高效率
  - 这时会从反射调用变为**正常调用**，即直接调用 Reflect1.foo()

[![img](https://s2.loli.net/2022/03/31/n5lYQMHG9fEBiPg.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200614135011.png)



# 九、 面试问题

## 谈谈你对JVM的理解

将一个class文件通过类加载机制装载到JVM里，然后放到不同的运行时数据区，通过编译器来编译

第一个部分class字节码文件，包含了一系列常量池、方法信息、字段信息等。

第二个部分类加载机制，class文件加载到内存中需要借助类加载机制，其包含加载、验证、准备、解析阶段，主要是类进行查找、验证以及分配相关内存空间和赋值

第三个部分jvm内存结构，class文件进入内存后该如何存储不同的数据以及数据该如何扭转。比如方法区会存储由class文件常量池对应的运行时常量池、字段和方法的元数据信息，类的模板信息等，堆是存储各种java中的对象实例，虚拟机栈通过线程以栈的方式运行加载各种方法，本地方法栈是加载运行本地类型的方法，程序计数器保存每个线程执行方法的实时地址。通过运行区的五个部分可以把数据存储和运行起来

第四个部分垃圾回收器，就是对内存结构中的数据进行管理和回收，回收机制可以基于不同的垃圾回收器，比如serial、parallel、cms、g1。这些收集器是对于不同垃圾收集算法的实现，主要是三个标记清除、标记整理、复制

第五个部分 解释器和即时编译器

第六个部分是JNI本地方法接口，如果想找到java中某个方法是如何通过c或者c++实现，就可以通过这个进行查找

## JVM内存模型

![image-20220309214910780](https://s2.loli.net/2022/04/01/j68Pqt5VxpM4fEB.png)

方法区、堆、虚拟机栈、程序计数器、本地方法栈

## 溢出问题

什么会导致栈溢出、堆内存溢出？

### **栈溢出**

- **栈帧过多导致栈内存溢出**      常见：递归
- **栈帧过大导致栈内存溢出** 

### **堆内存溢出**。

通常都是建立了大量的对象，这些对象一直被引用着，没法被GC垃圾回收掉，最终致使堆内存被占满，没有足够的空间存放新建立的对象时，就会出现堆内存溢出问题。

### 如何排查堆溢出

堆内存溢出的时候，虚拟机会抛出 java.lang.OutOfMemoryError:java heap space。

出现此种情况的时候，我们需要根据内存溢出的时候产生的 dump 文件来具体分析（需要增加 -XX:+HeapDumpOnOutOfMemoryError jvm启动参数）。出现此种问题的时候有可能是内存泄漏，也有可能是内存溢出了。

```
1、配置方法

-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=${目录}。
2、参数说明

（1）-XX:+HeapDumpOnOutOfMemoryError参数表示当JVM发生OOM时，自动生成DUMP文件。

（2）-XX:HeapDumpPath=${目录}参数表示生成DUMP文件的路径，也可以指定文件名称，例如：-XX:HeapDumpPath=${目录}/java_heapdump.hprof。如果不指定文件名，默认为：java_<pid><date><time>_heapDump.hprof。
```

如果是内存泄漏，我们要找出内存泄漏的对象是怎么被GC ROOT引用起来，然后通过引用链来具体分析泄露的原因。

如果出现了内存溢出问题，这往往是程序本生需要的内存大于了我们给虚拟机配置的内存，这种情况下，我们可以采用调大-Xmx来解决这种问题。



## GC ROOT

如何判断对象可以回收？

早期：引用计数法（只要对象被其他对象所引用，对象的计数器加一，不再引用，计数减一，为0时被回收）

可达性分析算法：如果一个对象没有被根对象直接或间接的引用，那么可以被回收掉。

**哪些可以作为GC ROOT？**

- 虚拟机栈（栈帧中的本地变量表）中引用的对象
- 方法区中类静态属性引用的对象
- 方法区中常量引用的对象
- 本地方法栈中JNI引用的对象

## 垃圾回收算法

标记-清除，标记-复制，标记-整理

## 分代回收

JVM新生代和老年代垃圾回收的方式

老年代：长时间使用的对象的存放位置，因为对象存活率高，没有额外空间进行分配担保，就需要标记-清理或整理进行回收

新生代：98%对象的生命周期较短的，用完就丢弃，垃圾回收较频繁，因此适合只需要付出少量复制成本的复制算法进行垃圾回收

## CMS回收过程

![img](https://s2.loli.net/2022/03/17/FMiSVyx1lnsw6XE.png)

Concurrent **Mark Sweep**，一种以获取**最短回收停顿时间**为目标的**老年代**收集器

**特点**：基于**标记-清除算法**实现。并发收集、低停顿，但是会产生内存碎片

**应用场景**：适用于注重服务的响应速度，希望系统停顿时间最短，给用户带来更好的体验等场景下。如web程序、b/s服务



**CMS收集器的运行过程分为下列4步：**

**初始标记**：标记GC Roots能**直接**引用到的对象。速度很快但是**仍存在Stop The World问题**

**并发标记**：进行GC Roots Tracing 的过程，找出所有存活对象且用户线程可**并发执行**(不需要STW)

**重新标记**：为了**修正并发标记期间**因用户程序继续运行而导致标记产生变动的那一部分对象的标记记录。仍然存在Stop The World问题 （较慢）

**并发清除**：对没有标记的对象进行清除回收-

CMS收集器的内存回收过程是与用户线程一起**并发执行**的，只有初始标记和重新标记需要STW



**缺点**：

1. 影响用户程序，虽然不会导致用户线程停顿，但是会占用一部分cpu资源而导致应用程序变慢；
2. 无法处理浮动垃圾（并发清除时，用户线程还在运行，可能还会有新垃圾产生，CMS无法在当次收集中处理），因为在垃圾收集阶段用户线程还需要运行，因此还需要留有足够内存空间给用户线程使用，不能等老年代几乎被填满了再进行收集，需要预留一部分空间提供并发收集时的程序运作使用；
3. 内存碎片过多



## 类加载过程

详情见八、类加载与字节码技术 4.2

加载—>验证—>准备—>解析—>初始化



## 类加载器

