# 💻 AI_report (Windows 硬件 AI 分析师 / Hardware AI Analyst)

**[🇨🇳 简体中文](#-简体中文) | [🇺🇸 English](#-english)**

[![C++](https://img.shields.io/badge/C%2B%2B-20-blue.svg)](https://en.cppreference.com/w/cpp/20)
[![Windows](https://img.shields.io/badge/Platform-Windows-lightgrey.svg)]()
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

<a id="-简体中文"></a>
## 🇨🇳 简体中文

> **一句话介绍**：一个基于 C++ 原生开发、结合 WMI 深度硬件采集与 DeepSeek AI 分析的 Windows 硬件检测工具。它不只会冷冰冰地罗列参数，还会“说人话”，为你生成专属的硬件性能定位、短板分析和使用建议。

### 💡 起初的想法（Why I Built This）

市面上的硬件检测工具（如鲁大师、AIDA64）虽然强大，但往往有几个痛点：
1. **数据冰冷且晦涩**：普通用户看到“14核20线程”、“L2/L3 缓存”、“PCIe 8 SSD”往往不知道这意味着什么，不知道这台电脑到底适合做什么。
2. **广告与臃肿**：很多工具自带全家桶或弹窗。
3. **本地隐私焦虑**：把带有序列号的完整硬件报告发给云端，总让人不放心。

因此，我想做一个**极简、纯净、智能化**的极客工具。它能在本地秒出报告，也能在你有网络时，通过接入 DeepSeek 大模型，为你生成一份像数码博主那样通俗易懂的“体检报告”。

### ✨ 核心特性（Features）

- 🚀 **纯原生 C++ 实现**：不依赖庞大第三方框架，编译后仅一个轻量级 `.exe` 文件。
- 🔍 **深度 WMI 硬件采集**：深挖 CPU、GPU、内存、硬盘、主板、BIOS、显示器、网卡、声卡、电池等核心信息。
- 🧠 **本地规则引擎 + AI 混合架构**：
  - **本地层**：处理 WMI 的历史遗留坑（如过滤虚拟网卡、识别板载内存假象、剔除基础显卡），秒出基础报告。
  - **AI 层**：按需唤醒 DeepSeek，将清洗后的脱敏数据扔给 AI，生成通俗易懂的性能定位与建议。
- 🔒 **极致隐私与安全**：
  - API Key **纯内存交互**，使用 `SecureZeroMemory` 彻底擦除。
  - 发给 AI 的数据自动过滤序列号、MAC 地址等唯一标识。
  - 支持 `Ctrl+V` 快捷粘贴密钥，并用 `*` 号实时遮挡。
- 🌐 **精准网络探测**：抛弃容易误判的 `ping`，使用 `curl` 发起 HEAD 请求直连 API 域名，绕过 DNS 污染和代理拦截误判。

### 🛠️ 技术原理（How it works）

程序的生命周期分为四个阶段：
1. **COM / WMI 初始化**：使用 `IWbemLocator` 连接 `ROOT\CIMV2` 与 `ROOT\WMI` 命名空间。
2. **查询与容错处理**：执行 WQL 查询，将 `VARIANT` 转换为宽字符。程序内置了大量启发式规则（如处理 `SafeArray` 越界、解析 `WmiMonitorID` 的真实显示器型号、判断 LPDDR 内存）。
3. **格式化输出**：将脏数据清洗后，按人类阅读习惯格式化输出到控制台（支持 UTF-16 完美显示中文）。
4. **AI 解读与网络握手**：使用 `libcurl` 测试 `api.deepseek.com` 的 443 端口连通性。若通，则引导用户输入 API Key，发起 HTTPS POST 请求获取 Markdown 文本，并按纯文本格式输出。

### 🧗‍♂️ 重点迭代过程（The Journey & Bug Fixes）

这个项目的代码经历了多轮“地狱级”的 Code Review，每一个遗留 Bug 的修复都让代码更坚固：

- **内存板载判定优化**：最初曾把华为笔记本的“8 个 2GB 颗粒”误认为 8 条插槽，后来加入了 `FormFactor`、`DIMM/Soldered` 关键字以及多通道一致性判断，规避了误判。
- **`MultiByteToWideChar` 越界打击**：在抓取外部命令输出转宽字符时，修复了经典的 `len-1` 导致的 Undefined Behavior (UB)，使用 `pop_back()` 完美规避越界写。
- **解决 `WmiMonitorID` 类型错乱**：显示器的真实型号藏在 `uint16[]` 的 SAFEARRAY 中，重写了指针遍历逻辑（`pData[i - lb]`），彻底杜绝了边界隐患。
- **网络连通性生死劫**：从最初的 `InternetGetConnectedState`（有网卡但没网也会误判），到 `ping + TTL`（容易被防火墙拦截 ICMP 导致误判），最终进化为 `libcurl HEAD` 请求，准度拉满。

### 💻 编译与运行（Build & Run）

#### 前置依赖
- **编译器**：GCC / MinGW-w64 (支持 C++20)
- **依赖库**：**重要！！** `libcurl` (MSYS2: `pacman -S mingw-w64-ucrt-x86_64-curl`)
- **JSON 库**：下载 [nlohmann/json](https://github.com/nlohmann/json) 的单文件 `json.hpp`，放到项目 `nlohmann/` 目录下。（文件中已包含）

#### 编译命令
在 PowerShell 或 CMD 中执行：
```bash
g++ -std=c++20 AI_report.cpp -o AI_report.exe -lole32 -loleaut32 -luuid -lwbemuuid -lshell32 -lcurl
```

#### 运行程序
建议**以管理员身份**运行 `AI_report.exe`（以便完整读取硬盘和主板序列号）。程序会先输出完整的硬件详细信息，随后你可以选择是否输入 DeepSeek API Key 进行 AI 解读。

*(注：DeepSeek 的 API 极其便宜，充 10 块钱能用很久。获取地址：[DeepSeek 开放平台](https://platform.deepseek.com/))*

### ⚠️ 注意事项

1. **WMI 的特性局限**：在某些精简版 Windows 或特定的 OEM 机器上，部分 WMI 接口（如电池健康度、显示器型号）可能会返回空值。程序已对此做了兜底处理。
2. **代码注释中的 `goto cleanup`**：为了保证 COM 指针在所有异常分支下都能被正确释放，程序在 `main` 函数中使用了 `goto cleanup`。请勿在 `goto` 跨越的作用域内添加需要 RAII 管理的对象（如 `std::vector`），以免造成析构跳过。
3. **控制台编码**：程序内部使用了 `_O_U16TEXT` 强制宽字符输出。如果你的终端出现乱码，请确保使用的是 Windows Terminal 或 PowerShell，而不是旧版的 `cmd.exe`。

### 📜 开源协议

本项目基于 [MIT License](LICENSE) 开源。你可以随意修改、分发，甚至将它作为你毕业设计或私人工具的基石。

---

<a id="-english"></a>
## 🇺🇸 English

> **Introduction**: A native C++ Windows hardware detection tool that combines deep WMI hardware collection with DeepSeek AI analysis. It doesn't just list cold parameters; it "speaks human" by generating exclusive hardware positioning, weakness analysis, and usage recommendations.

### 💡 Why I Built This

While commercial hardware tools (like Lu Master, AIDA64) are powerful, they often have several pain points:
1. **Cold and cryptic data**: Ordinary users seeing "14 cores, 20 threads", "L2/L3 cache", or "PCIe 8 SSD" have no idea what it means or what the computer is actually suitable for.
2. **Bloatware and Ads**: Many tools come with bundled software or pop-ups.
3. **Local privacy anxiety**: Sending complete hardware reports with serial numbers to the cloud always feels insecure.

Therefore, I wanted to build a **minimalist, pure, and intelligent** geek tool. It can instantly generate a report locally, and when you have an internet connection, it hooks up with the DeepSeek LLM to generate a "health check report" that is as easy to understand as those from tech influencers.

### ✨ Features

- 🚀 **Pure Native C++**: No bulky third-party frameworks; compiles into a single lightweight `.exe`.
- 🔍 **Deep WMI Hardware Collection**: Extracts core info including CPU, GPU, Memory, Disk, Motherboard, BIOS, Monitor, Network Adapter, Sound Card, and Battery.
- 🧠 **Hybrid Local Rules + AI Architecture**:
  - **Local Layer**: Handles WMI legacy quirks (e.g., filtering virtual NICs, detecting onboard memory illusions, excluding basic display adapters) to generate a fast baseline report.
  - **AI Layer**: Awakens DeepSeek on demand, sending cleaned and sanitized data to the AI for human-readable performance positioning and advice.
- 🔒 **Ultimate Privacy & Security**:
  - API Key is handled **entirely in memory** and securely erased using `SecureZeroMemory`.
  - Data sent to AI automatically filters out unique identifiers like serial numbers and MAC addresses.
  - Supports `Ctrl+V` to quickly paste the key, masked in real-time with `*`.
- 🌐 **Accurate Network Detection**: Drops the error-prone `ping` and uses `curl` to send a HEAD request directly to the API domain, bypassing DNS pollution and proxy interception misjudgments.

### 🛠️ How it works

The program lifecycle is divided into four phases:
1. **COM / WMI Initialization**: Uses `IWbemLocator` to connect to the `ROOT\CIMV2` and `ROOT\WMI` namespaces.
2. **Query & Fault Tolerance**: Executes WQL queries and converts `VARIANT` to wide chars. Built-in heuristics handle `SafeArray` out-of-bounds, parse real monitor models from `WmiMonitorID`, and identify LPDDR memory.
3. **Formatting Output**: Cleans dirty data and formats it to the console following human reading habits (supports UTF-16 for perfect Chinese rendering).
4. **AI Interaction & Network Handshake**: Uses `libcurl` to test port 443 connectivity to `api.deepseek.com`. If reachable, prompts the user for an API Key, sends an HTTPS POST request, and outputs the response as plain text.

### 🧗‍♂️ The Journey & Bug Fixes

This project underwent multiple rounds of "hell-level" Code Reviews. Every legacy bug fixed made the code more robust:

- **Memory Onboard Logic Optimization**: Initially mistook a Huawei laptop's "8 x 2GB granules" for 8 slots. Fixed by adding `FormFactor`, `DIMM/Soldered` keyword checks, and multi-channel consistency validation.
- **`MultiByteToWideChar` Out-of-Bounds Strike**: When capturing external command output and converting to wide chars, fixed the classic `len-1` Undefined Behavior (UB) by using `pop_back()` to avoid out-of-bounds writes.
- **`WmiMonitorID` Type Fix**: The real monitor model is hidden in the `uint16[]` SAFEARRAY. Rewrote the pointer traversal logic (`pData[i - lb]`) to completely eliminate boundary hazards.
- **Network Connectivity Evolution**: From `InternetGetConnectedState` (misjudges when a NIC exists but no internet), to `ping + TTL` (blocked by firewalls misjudging ICMP), and finally evolved into `libcurl HEAD` requests for maximum accuracy.

### 💻 Build & Run

#### Prerequisites
- **Compiler**: GCC / MinGW-w64 (C++20 support)
- **Dependencies**: **IMPORTANT!!** `libcurl` (MSYS2: `pacman -S mingw-w64-ucrt-x86_64-curl`)
- **JSON Library**: Download [nlohmann/json](https://github.com/nlohmann/json) single-header `json.hpp` and place it in the `nlohmann/` directory. (Already included in the repo)

#### Compile Command
Execute in PowerShell or CMD:
```bash
g++ -std=c++20 AI_report.cpp -o AI_report.exe -lole32 -loleaut32 -luuid -lwbemuuid -lshell32 -lcurl
```

#### Run the Program
It's recommended to run `AI_report.exe` **as Administrator** (to fully read disk and motherboard serial numbers). The program will first output detailed local hardware info, then ask if you want to enter a DeepSeek API Key for AI analysis.

*(Note: DeepSeek's API is extremely cheap. $1 can last a very long time. Get yours at [DeepSeek Platform](https://platform.deepseek.com/))*

### ⚠️ Notes

1. **WMI Limitations**: On some Lite versions of Windows or specific OEM machines, certain WMI interfaces (like battery health or monitor model) may return empty values. The program has fallback handling for this.
2. **`goto cleanup` in Code**: To ensure COM pointers are properly released in all exception branches, `main` uses `goto cleanup`. Do NOT add objects requiring RAII management (like `std::vector`) inside the scope crossed by `goto`, to avoid skipping destructors.
3. **Console Encoding**: The program internally uses `_O_U16TEXT` to force wide-char output. If you see garbled text, ensure you are using Windows Terminal or PowerShell, not the legacy `cmd.exe`.

### 📜 License

This project is open-sourced under the [MIT License](LICENSE). Feel free to modify, distribute, or even use it as a foundation for your graduation project or personal tools.
