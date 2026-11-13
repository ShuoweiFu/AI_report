// Copyright 2024 ShuoweiFu
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// 编译：g++ -std=c++20 AI_report.cpp -o AI_report.exe -lole32 -loleaut32 -luuid -lwbemuuid -lshell32 -lcurl

#define _WIN32_DCOM
#include <iostream>
#include <iomanip>
#include <sstream>
#include <string>
#include <vector>
#include <map>
#include <cwctype>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <conio.h>
#include <comdef.h>
#include <Wbemidl.h>
#include <fcntl.h>
#include <io.h>
#include <windows.h>
#include <shellapi.h>
#include <curl/curl.h>
#include "nlohmann/json.hpp"

#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")
#pragma comment(lib, "uuid.lib")
#pragma comment(lib, "wbemuuid.lib")
#pragma comment(lib, "shell32.lib")

using json = nlohmann::json;
using namespace std;

// ================= 国际化 (i18n) =================
bool g_isZh = false;

const wchar_t* Tr(const wchar_t* zh, const wchar_t* en) {
    return g_isZh ? zh : en;
}

// ================= 宽窄字符转换 =================
string WideToUtf8(const wstring& w) {
    if (w.empty()) return "";
    int len = WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), nullptr, 0, nullptr, nullptr);
    string s(len, 0);
    WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), &s[0], len, nullptr, nullptr);
    return s;
}

wstring Utf8ToWide(const string& s) {
    if (s.empty()) return L"";
    int len = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), nullptr, 0);
    wstring w(len, 0);
    MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), &w[0], len);
    return w;
}

// ================= 基础工具 =================
bool ContainsAny(const wstring& s, initializer_list<const wchar_t*> keys) {
    for (auto k : keys) if (s.find(k) != wstring::npos) return true;
    return false;
}

wstring ToWString(const VARIANT& v) {
    switch (v.vt) {
        case VT_NULL: case VT_EMPTY: return L"";
        case VT_BSTR: return wstring(v.bstrVal, SysStringLen(v.bstrVal));
        case VT_I1: return to_wstring((int)v.cVal);
        case VT_UI1: return to_wstring((unsigned)v.bVal);
        case VT_I2: return to_wstring(v.iVal);
        case VT_UI2: return to_wstring(v.uiVal);
        case VT_I4: return to_wstring(v.lVal);
        case VT_UI4: return to_wstring(v.ulVal);
        case VT_I8: return to_wstring(v.llVal);
        case VT_UI8: return to_wstring(v.ullVal);
        case VT_R4: { wostringstream s; s << v.fltVal; return s.str(); }
        case VT_R8: { wostringstream s; s << v.dblVal; return s.str(); }
        case VT_BOOL: return v.boolVal == VARIANT_TRUE ? L"True" : L"False";
        case VT_DATE: {
            SYSTEMTIME st;
            if (VariantTimeToSystemTime(v.date, &st)) {
                wostringstream s;
                s << st.wYear << L"/" << setw(2) << setfill(L'0') << st.wMonth << L"/"
                  << setw(2) << st.wDay << L" " << setw(2) << st.wHour << L":"
                  << setw(2) << st.wMinute << L":" << setw(2) << st.wSecond;
                return s.str();
            }
            return L"";
        }
        case (VT_ARRAY | VT_UI2): {
            SAFEARRAY* psa = v.parray;
            if (!psa) return L"";
            uint16_t* pData = nullptr;
            if (FAILED(SafeArrayAccessData(psa, (void**)&pData))) return L"";
            LONG lb = 0, ub = -1;
            SafeArrayGetLBound(psa, 1, &lb);
            SafeArrayGetUBound(psa, 1, &ub);
            wstring s;
            for (LONG i = lb; i <= ub; ++i) {
                if (pData[i - lb] == 0) break;
                s.push_back((wchar_t)pData[i - lb]);
            }
            SafeArrayUnaccessData(psa);
            return s;
        }
        default: return L"";
    }
}

wstring FormatWmiDate(const wstring& raw) {
    if (raw.size() < 8) return raw;
    for (size_t i = 0; i < 8; ++i) if (!iswdigit(raw[i])) return raw;
    wstring y = raw.substr(0,4), m = raw.substr(4,2), d = raw.substr(6,2);
    wstring hh = raw.size()>=10 ? raw.substr(8,2) : L"00";
    wstring mm = raw.size()>=12 ? raw.substr(10,2) : L"00";
    wstring ss = raw.size()>=14 ? raw.substr(12,2) : L"00";
    return y + L"/" + m + L"/" + d + L" " + hh + L":" + mm + L":" + ss;
}

wstring BytesToGB(unsigned long long bytes, int prec = 2) {
    wostringstream s;
    s << fixed << setprecision(prec) << (double)bytes / (1024.0*1024.0*1024.0) << L" GB";
    return s.str();
}

wstring FormatMhzToGHz(const wstring& s) {
    if (s.empty()) return Tr(L"未知", L"Unknown");
    double d = 0;
    wistringstream iss(s);
    if (iss >> d && d > 0) {
        wostringstream out;
        out << fixed << setprecision(2) << d / 1000.0 << L" GHz";
        return out.str();
    }
    return Tr(L"未知", L"Unknown");
}

wstring FormatKBToMB(const wstring& s) {
    if (s.empty()) return Tr(L"未知", L"Unknown");
    double d = 0;
    wistringstream iss(s);
    if (iss >> d && d > 0) {
        wostringstream out;
        out << fixed << setprecision(2) << d / 1024.0 << L" MB";
        return out.str();
    }
    return Tr(L"未知", L"Unknown");
}

void ParseResolution(const wstring& desc, int& w, int& h) {
    w = h = 0;
    vector<long long> nums;
    long long cur = 0; bool in = false;
    for (wchar_t c : desc) {
        if (iswdigit(c)) { cur = cur*10 + (c - L'0'); in = true; }
        else { if (in) { nums.push_back(cur); cur = 0; in = false; } }
    }
    if (in) nums.push_back(cur);
    if (nums.size() >= 2) { w = (int)nums[0]; h = (int)nums[1]; }
}

wstring BatteryStatusStr(unsigned v) {
    switch (v) {
        case 1: return Tr(L"放电中（使用电池）", L"Discharging (Battery)");
        case 2: return Tr(L"接交流电", L"Plugged In (AC)");
        case 3: return Tr(L"已充满", L"Fully Charged");
        case 4: return Tr(L"电量低", L"Low");
        case 5: return Tr(L"电量危急", L"Critical");
        case 6: return Tr(L"充电中", L"Charging");
        case 7: return Tr(L"充电中（电量高）", L"Charging (High)");
        case 8: return Tr(L"充电中（电量低）", L"Charging (Low)");
        case 9: return Tr(L"充电中（电量危急）", L"Charging (Critical)");
        case 11: return Tr(L"部分充电", L"Partially Charged");
        default: return Tr(L"未知状态", L"Unknown Status");
    }
}

wstring ShortCpuName(const wstring& full) {
    const wchar_t* pref[] = { L"Ultra ", L"Ryzen ", L"i9-", L"i7-", L"i5-", L"i3-" };
    for (auto p : pref) {
        auto pos = full.find(p);
        if (pos == wstring::npos) continue;
        auto end = pos;
        while (end < full.size() && (iswalnum(full[end]) || full[end] == L'-' || full[end] == L' ')) ++end;
        wstring s = full.substr(pos, end - pos);
        while (!s.empty() && s.back() == L' ') s.pop_back();
        return s;
    }
    return full;
}

wstring IntelGen(const wstring& name) {
    auto upos = name.find(L"Ultra ");
    if (upos != wstring::npos) {
        int numCount = 0;
        wstring digits;
        for (size_t i = upos; i < name.size(); ++i) {
            if (iswdigit(name[i])) digits += name[i];
            else if (!digits.empty()) {
                numCount++;
                if (numCount == 2) break;
                digits.clear();
            }
        }
        if (digits.size() >= 3) {
            int n = stoi(digits);
            if (n >= 100 && n < 200) return L"Core Ultra Series 1";
            if (n >= 200) return L"Core Ultra Series 2";
        }
    }

    auto rpos = name.find(L"Ryzen");
    if (rpos != wstring::npos) {
        int numCount = 0;
        wstring digits;
        for (size_t i = rpos; i < name.size(); ++i) {
            if (iswdigit(name[i])) digits += name[i];
            else if (!digits.empty()) {
                numCount++;
                if (numCount == 2) break;
                digits.clear();
            }
        }
        if (digits.size() >= 4) return digits.substr(0, 1) + L"000 Series";
        if (digits.size() == 3) return digits + L" Series";
    }

    const wchar_t* pref[] = { L"i9-", L"i7-", L"i5-", L"i3-" };
    for (auto p : pref) {
        auto pos = name.find(p);
        if (pos == wstring::npos) continue;
        size_t i = pos + 3;
        wstring digits;
        while (i < name.size() && iswdigit(name[i])) digits += name[i++];
        if (digits.size() >= 3) {
            int gen = 0;
            if (digits.size() == 5) {
                gen = stoi(digits.substr(0, 2));
            } else if (digits.size() == 4) {
                int prefix2 = stoi(digits.substr(0, 2));
                if (prefix2 >= 10 && prefix2 <= 14) gen = prefix2;
                else gen = stoi(digits.substr(0, 1));
            } else {
                gen = stoi(digits.substr(0, 1));
            }
            if (gen > 0) return to_wstring(gen) + Tr(L" 代", L"th Gen");
        }
    }
    return L"";
}

wstring MapDeviceModel(const wstring& man, const wstring& model) {
    struct E { const wchar_t* m; const wchar_t* mm; const wchar_t* zh; const wchar_t* en; };
    static const E table[] = {
        {L"HUAWEI", L"CREF-XX",  L"华为 MateBook 16s 2022", L"HUAWEI MateBook 16s 2022"},
        {L"HUAWEI", L"CREM-WXX", L"华为 MateBook 16s 2023", L"HUAWEI MateBook 16s 2023"},
        {L"HUAWEI", L"HKFG-XX",  L"华为 MateBook X Pro 2022", L"HUAWEI MateBook X Pro 2022"},
        {L"HUAWEI", L"MRGF-XX",  L"华为 MateBook 14 2022", L"HUAWEI MateBook 14 2022"},
        {L"HUAWEI", L"KLVL-WXX", L"华为 MateBook 14 2020", L"HUAWEI MateBook 14 2020"},
        {L"HUAWEI", L"MRR-WXX",  L"华为 MateBook 16 2021", L"HUAWEI MateBook 16 2021"},
        {L"LENOVO", L"82",       L"联想小新 / YOGA 系列", L"Lenovo Xiaoxin / YOGA Series"},
        {L"LENOVO", L"21",       L"联想 ThinkPad 系列", L"Lenovo ThinkPad Series"},
    };
    for (auto& e : table) {
        if (man != e.m) continue;
        wstring mm = e.mm;
        if (mm.empty()) return g_isZh ? e.zh : e.en;
        if (model == mm || model.rfind(mm, 0) == 0) return g_isZh ? e.zh : e.en;
    }
    return L"";
}

// ================= WMI 封装 =================
struct Instance {
    map<wstring, wstring> props;
    wstring get(const wstring& k) const {
        auto it = props.find(k);
        return it == props.end() ? L"" : it->second;
    }
    unsigned long long getU64(const wstring& k) const {
        wstring s = get(k);
        if (s.empty()) return 0;
        try { return stoull(s); } catch(...) { return 0; }
    }
};

vector<Instance> QueryAll(IWbemServices* pSvc, const wstring& wql,
                          const vector<wstring>& props) {
    vector<Instance> out;
    IEnumWbemClassObject* pEnum = nullptr;
    HRESULT hr = pSvc->ExecQuery(
        bstr_t("WQL"), bstr_t(wql.c_str()),
        WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY,
        nullptr, &pEnum);
    if (FAILED(hr)) return out;

    IWbemClassObject* pObj = nullptr;
    ULONG ret = 0;
    while (pEnum) {
        hr = pEnum->Next(WBEM_INFINITE, 1, &pObj, &ret);
        if (ret == 0 || !pObj) break;
        
        Instance inst;
        try {
            for (auto& p : props) {
                VARIANT v; VariantInit(&v);
                if (SUCCEEDED(pObj->Get(p.c_str(), 0, &v, nullptr, nullptr))) {
                    inst.props[p] = ToWString(v);
                    VariantClear(&v);
                }
            }
            out.push_back(std::move(inst));
        } catch (...) {
            pObj->Release();
            if (pEnum) pEnum->Release();
            return {}; 
        }
        pObj->Release(); pObj = nullptr;
    }
    if (pEnum) pEnum->Release();
    return out;
}

// ================= 分类判定 =================
bool IsVirtualGpu(const wstring& n) {
    return ContainsAny(n, { L"MuMu", L"VMware", L"VirtualBox",
                            L"Parsec", L"Citrix", L"ToDesk", L"Sunlogin",
                            L"Oray", L"TeamViewer", L"Remote Display" });
}
bool IsIntegratedGpu(const wstring& n) {
    return ContainsAny(n, { L"Intel(R) UHD", L"Intel(R) Iris", L"Intel(R) HD Graphics",
                            L"Arc(TM) Graphics", L"Radeon(TM) Graphics",
                            L"Radeon Vega", L"Apple", L"Adreno" });
}
bool IsDiscreteGpu(const wstring& n) {
    return ContainsAny(n, { L"NVIDIA", L"GeForce", L"RTX", L"GTX", L"Quadro",
                            L"Radeon RX", L"Radeon Pro", L"Arc A", L"Arc B" });
}
bool IsVirtualNic(const wstring& n) {
    return ContainsAny(n, { L"TAP-", L"TAP-Windows", L"TUN", L"WireGuard",
                            L"OpenVPN", L"Proton", L"Radmin", L"VMware",
                            L"VirtualBox", L"Hyper-V", L"Loopback",
                            L"WAN Miniport", L"Steam", L"ZeroTier",
                            L"Tailscale", L"Oray", L"ToDesk", L"Sunlogin",
                            L"Sangfor", L"Bluetooth" });
}

// ================= 各模块分析 =================
using KV = vector<pair<wstring,wstring>>;

void AnalyzeCPU(IWbemServices* pSvc, KV& sum, KV& aiData,
                wostringstream& detail, vector<wstring>& tips) {
    auto cpus = QueryAll(pSvc, L"SELECT * FROM Win32_Processor",
        { L"Name", L"NumberOfCores", L"NumberOfLogicalProcessors",
          L"MaxClockSpeed", L"L2CacheSize", L"L3CacheSize" });
    if (cpus.empty()) return;
    auto& c = cpus[0];
    wstring full = c.get(L"Name");
    wstring shortName = ShortCpuName(full);
    wstring gen = IntelGen(shortName);
    wstring cores = c.get(L"NumberOfCores");
    wstring threads = c.get(L"NumberOfLogicalProcessors");
    wstring freqStr = FormatMhzToGHz(c.get(L"MaxClockSpeed"));

    wstring s = shortName;
    if (!gen.empty()) s += L" (" + gen + L")";
    s += L", " + cores + Tr(L" 核 ", L" Cores ") + threads + Tr(L" 线程", L" Threads");
    sum.push_back({Tr(L"CPU", L"CPU"), s});

    detail << L"\n[" << Tr(L"处理器", L"CPU") << L"]\n";
    detail << L"  " << Tr(L"型号   : ", L"Model   : ") << full << L"\n";
    detail << L"  " << Tr(L"简称   : ", L"Alias   : ") << shortName;
    if (!gen.empty()) detail << L" (" << gen << L")";
    detail << L"\n";
    detail << L"  " << Tr(L"核心   : ", L"Cores   : ") << cores << Tr(L" 核 ", L" Cores ") << threads << Tr(L" 线程\n", L" Threads\n");
    detail << L"  " << Tr(L"基准   : ", L"Base    : ") << freqStr << L"\n";
    
    wstring l2 = FormatKBToMB(c.get(L"L2CacheSize"));
    if (l2 != Tr(L"未知", L"Unknown")) detail << L"  " << Tr(L"L2     : ", L"L2      : ") << l2 << L"\n";
    wstring l3 = FormatKBToMB(c.get(L"L3CacheSize"));
    if (l3 != Tr(L"未知", L"Unknown")) detail << L"  " << Tr(L"L3     : ", L"L3      : ") << l3 << L"\n";

    wostringstream ai;
    ai << shortName;
    if (!gen.empty()) ai << L" (" << gen << L")";
    ai << L", " << cores << Tr(L" 核 ", L" Cores ") << threads << Tr(L" 线程", L" Threads") << Tr(L"，基准 ", L", Base ") << freqStr;
    aiData.push_back({Tr(L"CPU", L"CPU"), ai.str()});
}

void AnalyzeGPU(IWbemServices* pSvc, int& resW, int& resH, KV& sum, KV& aiData,
                wostringstream& detail, vector<wstring>& tips) {
    auto gpus = QueryAll(pSvc, L"SELECT * FROM Win32_VideoController",
        { L"Name", L"AdapterCompatibility", L"DriverVersion", L"VideoModeDescription" });
    vector<wstring> integ, disc, virt, other, basic;

    for (auto& g : gpus) {
        wstring n = g.get(L"Name");
        if (n.empty()) continue;
        
        if (n.find(L"Microsoft Basic") != wstring::npos) {
            basic.push_back(n);
            continue;
        }

        if (IsVirtualGpu(n)) { virt.push_back(n); continue; }
        if (IsDiscreteGpu(n)) disc.push_back(n);
        else if (IsIntegratedGpu(n)) integ.push_back(n);
        else other.push_back(n);

        int w, h; ParseResolution(g.get(L"VideoModeDescription"), w, h);
        if (w > 0 && h > 0 && w*h > resW*resH) { resW = w; resH = h; }
    }

    wstring gs;
    if (!disc.empty()) {
        gs = Tr(L"独显 ", L"Discrete GPU ") + disc[0];
        if (!integ.empty()) gs += Tr(L" + 核显", L" + Integrated");
    } else if (!integ.empty()) {
        gs = Tr(L"核显 ", L"Integrated ") + integ[0] + Tr(L"（无独显）", L" (No Discrete)");
    } else if (!basic.empty()) {
        gs = Tr(L"基础显示适配器（显卡驱动可能未安装）", L"Basic Display Adapter (Drivers missing)");
    } else if (!other.empty()) {
        gs = Tr(L"未知显卡 ", L"Unknown GPU ") + other[0];
    } else {
        gs = Tr(L"未检测到独立显卡", L"No Discrete GPU Detected");
    }
    sum.push_back({Tr(L"显卡", L"GPU"), gs});
    aiData.push_back({Tr(L"显卡", L"GPU"), gs});

    detail << L"\n[" << Tr(L"显卡", L"Graphics") << L"]\n";
    for (auto& d : disc) detail << L"  " << Tr(L"独显 : ", L"Discrete : ") << d << L"\n";
    for (auto& i : integ) detail << L"  " << Tr(L"核显 : ", L"Integrated : ") << i << L"\n";
    for (auto& o : other) detail << L"  " << Tr(L"未知 : ", L"Unknown : ") << o << L"\n";
    
    if (!basic.empty()) {
        for (auto& b : basic) detail << L"  " << Tr(L"基础 : ", L"Basic : ") << b << L"\n";
        tips.push_back(Tr(L"检测到 Microsoft Basic Display Adapter，说明显卡驱动可能未安装，请尽快安装官方驱动以提升性能。",
                          L"Microsoft Basic Display Adapter detected. GPU drivers may be missing. Install official drivers for better performance."));
    }

    if (disc.empty() && basic.empty() && integ.empty()) {
        detail << L"  " << Tr(L"独显 : 无\n", L"Discrete : None\n");
        tips.push_back(Tr(L"未检测到独立显卡，3D 游戏 / 建模 / 视频渲染性能受核显限制。",
                          L"No discrete GPU detected. 3D gaming, modeling, and video rendering performance will be limited."));
    }
    if (!virt.empty()) {
        wstring s;
        for (auto& v : virt) { if (!s.empty()) s += L", "; s += v; }
        detail << L"  " << Tr(L"虚拟 : ", L"Virtual : ") << s << Tr(L"（模拟器 / 虚拟机生成，非真实硬件）\n", L" (Generated by emulator/VM, not real hardware)\n");
    }
}

void AnalyzeMemory(IWbemServices* pSvc, KV& sum, KV& aiData,
                   wostringstream& detail, vector<wstring>& tips) {
    auto mems = QueryAll(pSvc, L"SELECT * FROM Win32_PhysicalMemory",
        { L"Capacity", L"Speed", L"ConfiguredClockSpeed", L"DeviceLocator", L"FormFactor" });
    detail << L"\n[" << Tr(L"内存", L"Memory") << L"]\n";
    if (mems.empty()) { detail << L"  " << Tr(L"未获取到内存信息\n", L"Failed to retrieve memory info\n"); return; }

    unsigned long long total = 0;
    wstring speed, conf;
    for (auto& m : mems) {
        total += m.getU64(L"Capacity");
        if (speed.empty()) speed = m.get(L"Speed");
        if (conf.empty())  conf  = m.get(L"ConfiguredClockSpeed");
    }

    detail << L"  " << Tr(L"总容量 : ", L"Total : ") << BytesToGB(total) << L"\n";
    if (!speed.empty() || !conf.empty()) {
        detail << L"  " << Tr(L"频率   : ", L"Speed : ");
        if (!speed.empty()) detail << Tr(L"标称 ", L"Rated ") << speed << L" MT/s";
        if (!conf.empty() && conf != speed) detail << Tr(L"，实际 ", L", Actual ") << conf << L" MT/s";
        detail << L"\n";
    }

    unsigned ff = 255;
    try { if(!mems[0].get(L"FormFactor").empty()) ff = stoul(mems[0].get(L"FormFactor")); } catch(...) {}
    
    bool isSlot = false;
    for (auto& m : mems) {
        if (ContainsAny(m.get(L"DeviceLocator"), {L"DIMM", L"Slot", L"Bank", L"SODIMM"})) {
            isSlot = true;
            break;
        }
    }

    bool onboard = false;
    wstring loc = mems[0].get(L"DeviceLocator");

    if (ff == 0 || ff == 21) {
        onboard = true;
    } else if (!isSlot && mems.size() >= 4) {
        bool same = true;
        unsigned long long first = mems[0].getU64(L"Capacity");
        for (auto& m : mems) if (m.getU64(L"Capacity") != first) same = false;
        if (same && first <= 4ULL*1024*1024*1024) onboard = true;
    } else if (!isSlot && ff == 255 && ContainsAny(loc, {L"Onboard", L"Soldered", L"BGA", L"Channel", L"Controller"})) {
        onboard = true;
    }

    if (onboard) {
        detail << L"  " << Tr(L"形态   : 板载", L"Type   : Onboard");
        if (g_isZh) detail << L"（WMI 按颗粒/通道粒度报告，实际就是 " << BytesToGB(total) << L" 板载内存）\n";
        else detail << L" (Reported by granule/channel, actually " << BytesToGB(total) << L" onboard memory)\n";
        tips.push_back(Tr(L"内存为板载焊接（或集成在主板），无法自行更换或加装内存条。",
                          L"Memory is soldered onboard. It cannot be upgraded or replaced."));
    } else {
        detail << L"  " << Tr(L"插槽   : 共 ", L"Slots  : ") << mems.size() << Tr(L" 条\n", L" sticks\n");
        for (size_t i = 0; i < mems.size(); ++i)
            detail << L"    [" << (i+1) << L"] " << mems[i].get(L"DeviceLocator")
                   << L" - " << BytesToGB(mems[i].getU64(L"Capacity")) << L"\n";
    }
    
    wstring memSum = BytesToGB(total);
    if (onboard) memSum += Tr(L" 板载", L" Onboard");
    sum.push_back({Tr(L"内存", L"Memory"), memSum});

    wostringstream ai;
    ai << BytesToGB(total) << (onboard ? Tr(L" 板载", L" Onboard") : L"");
    if (!speed.empty()) ai << Tr(L"，标称 ", L", Rated ") << speed << L" MT/s";
    if (!conf.empty() && conf != speed) ai << Tr(L"，实际 ", L", Actual ") << conf << L" MT/s";
    aiData.push_back({Tr(L"内存", L"Memory"), ai.str()});
}

void AnalyzeDisk(IWbemServices* pSvc, KV& sum, KV& aiData,
                 wostringstream& detail, vector<wstring>& tips) {
    auto disks = QueryAll(pSvc, L"SELECT * FROM Win32_DiskDrive ORDER BY Index",
        { L"Model", L"Size", L"InterfaceType", L"MediaType" });
    if (disks.empty()) {
        disks = QueryAll(pSvc, L"SELECT * FROM Win32_DiskDrive",
            { L"Model", L"Size", L"InterfaceType", L"MediaType" });
    }

    detail << L"\n[" << Tr(L"硬盘", L"Storage") << L"]\n";
    wstring internalSum, externalSum;
    for (auto& d : disks) {
        wstring model = d.get(L"Model");
        unsigned long long size = d.getU64(L"Size");
        wstring media = d.get(L"MediaType");
        wstring iface = d.get(L"InterfaceType");
        bool external = (media.find(L"External") != wstring::npos) || (iface == L"USB");
        wstring line = model + L" (" + BytesToGB(size) + L", " + iface + L")";
        if (external) {
            detail << L"  " << Tr(L"外置 : ", L"External : ") << line << L"\n";
            if (!externalSum.empty()) externalSum += L" + ";
            externalSum += model;
            
            // 修复：编译器类型转换错误
            wstring tipZh = L"检测到外置硬盘（" + model + L"），读写时请勿直接拔出，先“安全弹出”再断开。";
            wstring tipEn = L"External drive detected (" + model + L"). Safely eject before unplugging.";
            tips.push_back(g_isZh ? tipZh : tipEn);
        } else {
            detail << L"  " << Tr(L"内置 : ", L"Internal : ") << line << L"\n";
            if (!internalSum.empty()) internalSum += L" + ";
            internalSum += model;
        }
    }
    wstring s;
    if (!internalSum.empty()) s = Tr(L"内置 ", L"Internal ") + internalSum;
    if (!externalSum.empty()) { if (!s.empty()) s += L" + "; s += Tr(L"外置 ", L"External ") + externalSum; }
    if (!s.empty()) { sum.push_back({Tr(L"硬盘", L"Storage"), s}); aiData.push_back({Tr(L"硬盘", L"Storage"), s}); }
}

void AnalyzeBoardBios(IWbemServices* pSvc, KV& sum, KV& aiData,
                      wostringstream& detail, vector<wstring>&) {
    auto boards = QueryAll(pSvc, L"SELECT * FROM Win32_BaseBoard",
        { L"Manufacturer", L"Product", L"Version" });
    auto bioses = QueryAll(pSvc, L"SELECT * FROM Win32_BIOS",
        { L"Version", L"ReleaseDate", L"SMBIOSBIOSVersion", L"SerialNumber" });

    detail << L"\n[" << Tr(L"主板 / BIOS", L"Motherboard / BIOS") << L"]\n";
    wstring boardStr;
    if (!boards.empty()) {
        auto& b = boards[0];
        boardStr = b.get(L"Manufacturer") + L" " + b.get(L"Product");
        if (!b.get(L"Version").empty()) boardStr += L" (" + b.get(L"Version") + L")";
        detail << L"  " << Tr(L"主板 : ", L"Board : ") << boardStr << L"\n";
    }
    if (!bioses.empty()) {
        auto& b = bioses[0];
        detail << L"  " << Tr(L"BIOS : ", L"BIOS  : ") << b.get(L"Version");
        if (!b.get(L"SMBIOSBIOSVersion").empty()) detail << L" / SMBIOS " << b.get(L"SMBIOSBIOSVersion");
        if (!b.get(L"ReleaseDate").empty()) detail << L" (" << FormatWmiDate(b.get(L"ReleaseDate")) << L")";
        detail << L"\n";
        if (!b.get(L"SerialNumber").empty()) detail << L"  " << Tr(L"序列 : ", L"Serial: ") << b.get(L"SerialNumber") << L"\n";
    }
    if (!boardStr.empty()) aiData.push_back({Tr(L"主板", L"Motherboard"), boardStr});
}

void AnalyzeMonitor(IWbemServices* pSvc, IWbemLocator* pLoc, int resW, int resH, KV& sum, KV& aiData,
                    wostringstream& detail, vector<wstring>&) {
    detail << L"\n[" << Tr(L"显示器", L"Monitor") << L"]\n";
    bool found = false;
    
    IWbemServices* pSvcWmi = nullptr;
    if (pLoc && SUCCEEDED(pLoc->ConnectServer(_bstr_t(L"ROOT\\WMI"), nullptr, nullptr, 0, 0, 0, 0, &pSvcWmi))) {
        CoSetProxyBlanket(pSvcWmi, RPC_C_AUTHN_WINNT, RPC_C_AUTHZ_NONE, nullptr,
            RPC_C_AUTHN_LEVEL_CALL, RPC_C_IMP_LEVEL_IMPERSONATE, nullptr, EOAC_NONE);
            
        auto monIds = QueryAll(pSvcWmi, L"SELECT * FROM WmiMonitorID", { L"ManufacturerName", L"UserFriendlyName" });
        for (auto& m : monIds) {
            wstring man = m.get(L"ManufacturerName");
            wstring name = m.get(L"UserFriendlyName");
            if (!man.empty() || !name.empty()) {
                detail << L"  " << Tr(L"型号 : ", L"Model : ") << name << L" (" << man << L")\n";
                found = true;
            }
        }
        pSvcWmi->Release();
    }

    if (!found) {
        auto mons = QueryAll(pSvc, L"SELECT * FROM Win32_DesktopMonitor",
            { L"Name", L"MonitorManufacturer" });
        for (auto& m : mons) {
            wstring name = m.get(L"Name");
            wstring man  = m.get(L"MonitorManufacturer");
            if (name == Tr(L"默认监视器", L"Default Monitor") && man.empty()) continue;
            detail << L"  " << Tr(L"型号 : ", L"Model : ") << name;
            if (!man.empty()) detail << L" (" << man << L")";
            detail << L"\n";
            found = true;
        }
    }
    
    if (!found) detail << L"  " << Tr(L"未获取到可识别的显示器型号\n", L"Could not identify monitor model\n");
    
    if (resW > 0 && resH > 0) {
        detail << L"  " << Tr(L"分辨率 : ", L"Res    : ") << resW << L" × " << resH << L"\n";
        wstring s = to_wstring(resW) + L" × " + to_wstring(resH);
        sum.push_back({Tr(L"屏幕", L"Display"), s});
        aiData.push_back({Tr(L"屏幕", L"Display"), s});
    }
}

void AnalyzeNetwork(IWbemServices* pSvc, KV& sum, KV& aiData,
                    wostringstream& detail, vector<wstring>&) {
    auto nics = QueryAll(pSvc, L"SELECT * FROM Win32_NetworkAdapter WHERE PhysicalAdapter=True",
        { L"Name", L"MACAddress", L"NetConnectionID" });
    detail << L"\n[" << Tr(L"网络适配器", L"Network Adapters") << L"]\n";
    vector<wstring> real, virt;
    for (auto& n : nics) {
        wstring name = n.get(L"Name");
        if (name.empty()) continue;
        wstring conn = n.get(L"NetConnectionID");
        if (IsVirtualNic(name)) virt.push_back(name);
        else real.push_back(name + (conn.empty() ? L"" : L" (" + conn + L")"));
    }
    if (!real.empty()) {
        for (auto& s : real) detail << L"  " << s << L"\n";
    } else {
        detail << L"  " << Tr(L"未检测到物理网卡\n", L"No physical network adapters detected\n");
    }
    
    if (!virt.empty()) {
        wstring s;
        for (auto& v : virt) { if (!s.empty()) s += L", "; s += v; }
        detail << L"  " << Tr(L"虚拟 : ", L"Virtual : ") << s << Tr(L"（VPN / 虚拟局域网 / 蓝牙，已从统计中排除）\n", L" (VPN / VLAN / Bluetooth, excluded from stats)\n");
    }
    
    wstring netSum;
    for (auto& r : real) {
        if (!netSum.empty()) netSum += L", ";
        netSum += r;
    }
    if (!netSum.empty()) {
        sum.push_back({Tr(L"网络", L"Network"), netSum});
        aiData.push_back({Tr(L"网络", L"Network"), netSum});
    }
}

void AnalyzeSound(IWbemServices* pSvc, KV& sum, KV& aiData,
                  wostringstream& detail, vector<wstring>&) {
    auto sounds = QueryAll(pSvc, L"SELECT * FROM Win32_SoundDevice",
        { L"Name", L"Manufacturer" });
    detail << L"\n[" << Tr(L"声卡", L"Audio") << L"]\n";
    if (sounds.empty()) { detail << L"  " << Tr(L"未检测到声卡\n", L"No audio devices detected\n"); return; }
    vector<wstring> real, virt;
    for (auto& s : sounds) {
        wstring name = s.get(L"Name");
        if (ContainsAny(name, { L"Steam", L"Virtual", L"VB-Audio", L"Voicemeeter" }))
            virt.push_back(name);
        else real.push_back(name);
    }
    for (auto& s : real) detail << L"  " << s << L"\n";
    if (!virt.empty()) {
        wstring s;
        for (auto& v : virt) { if (!s.empty()) s += L", "; s += v; }
        detail << L"  " << Tr(L"虚拟 : ", L"Virtual : ") << s << Tr(L"（串流 / 虚拟声卡）\n", L" (Streaming / Virtual Audio)\n");
    }
    
    wstring soundDesc = to_wstring(sounds.size()) + Tr(L" 个设备", L" devices");
    if (!real.empty()) {
        wstring names;
        for (auto& r : real) { if (!names.empty()) names += L", "; names += r; }
        soundDesc += Tr(L"（主设备: ", L" (Primary: ") + names + L")";
    }
    sum.push_back({Tr(L"声卡", L"Audio"), soundDesc});
    aiData.push_back({Tr(L"声卡", L"Audio"), soundDesc});
}

void AnalyzeBattery(IWbemServices* pSvc, KV& sum, KV& aiData,
                    wostringstream& detail, vector<wstring>& tips) {
    auto bats = QueryAll(pSvc, L"SELECT * FROM Win32_Battery",
        { L"Name", L"EstimatedChargeRemaining", L"BatteryStatus",
          L"DesignCapacity", L"FullChargeCapacity" });
    detail << L"\n[" << Tr(L"电池", L"Battery") << L"]\n";
    if (bats.empty()) {
        detail << L"  " << Tr(L"未检测到电池（台式机或电池已被移除）\n", L"No battery detected (Desktop or removed)\n");
        return;
    }
    
    wstring batSum;
    bool missingCap = false;
    int batIdx = 1;
    for (auto& b : bats) {
        wstring name   = b.get(L"Name");
        wstring remain = b.get(L"EstimatedChargeRemaining");
        unsigned status = 0;
        try { status = (unsigned)stoul(b.get(L"BatteryStatus")); } catch(...) {}

        detail << L"  [" << batIdx++ << L"] " << Tr(L"型号 : ", L"Model : ") << name << L"\n";
        detail << L"      " << Tr(L"状态 : ", L"Status: ") << BatteryStatusStr(status);
        if (!remain.empty()) detail << Tr(L"，电量 ", L", Charge ") << remain << L"%";
        detail << L"\n";

        if (!batSum.empty()) batSum += L" | ";
        batSum += name;
        if (!remain.empty()) batSum += L", " + remain + L"%";
        batSum += L", " + BatteryStatusStr(status);

        if (b.get(L"DesignCapacity").empty() || b.get(L"FullChargeCapacity").empty())
            missingCap = true;
    }

    sum.push_back({Tr(L"电池", L"Battery"), batSum});
    aiData.push_back({Tr(L"电池", L"Battery"), batSum});

    if (missingCap)
        tips.push_back(Tr(L"电池设计容量 / 满充容量 WMI 未提供（华为等品牌常见），如需电池健康度请用 powercfg /batteryreport。",
                          L"Battery design/full charge capacity not provided by WMI (common on some OEMs). Use 'powercfg /batteryreport' for health info."));
}

// ================= 控制台输入 =================
wchar_t ReadChoice() {
    HANDLE hIn = GetStdHandle(STD_INPUT_HANDLE);
    DWORD oldMode;
    GetConsoleMode(hIn, &oldMode);
    SetConsoleMode(hIn, oldMode & ~ENABLE_PROCESSED_INPUT);

    wchar_t result = L'Q';
    while (true) {
        INPUT_RECORD rec;
        DWORD read = 0;
        if (!ReadConsoleInputW(hIn, &rec, 1, &read)) break;
        if (rec.EventType != KEY_EVENT) continue;
        if (!rec.Event.KeyEvent.bKeyDown) continue;

        WORD vk = rec.Event.KeyEvent.wVirtualKeyCode;
        wchar_t ch = rec.Event.KeyEvent.uChar.UnicodeChar;
        DWORD ctrl = rec.Event.KeyEvent.dwControlKeyState;
        bool ctrlDown = (ctrl & (LEFT_CTRL_PRESSED | RIGHT_CTRL_PRESSED)) != 0;

        if (ctrlDown && vk == 'C') {
            wcout << L"^C" << endl;
            result = L'Q';
            break;
        }
        if (ch == 'y' || ch == 'Y') { wcout << L"Y" << endl; result = L'Y'; break; }
        if (ch == 'n' || ch == 'N') { wcout << L"N" << endl; result = L'N'; break; }
        if (ch == 'q' || ch == 'Q') { wcout << L"Q" << endl; result = L'Q'; break; }
        
        if (ch >= 32) {
            wcout << L"\n" << Tr(L"请按 Y / N / Q: ", L"Please press Y / N / Q: ");
        }
    }
    
    SetConsoleMode(hIn, oldMode);
    return result;
}

wstring GetClipboardText() {
    if (!OpenClipboard(nullptr)) return L"";
    HANDLE hData = GetClipboardData(CF_UNICODETEXT);
    if (!hData) { CloseClipboard(); return L""; }
    wchar_t* p = (wchar_t*)GlobalLock(hData);
    wstring s;
    if (p) { s = p; GlobalUnlock(hData); }
    CloseClipboard();
    return s;
}

wstring ReadPassword() {
    HANDLE hIn = GetStdHandle(STD_INPUT_HANDLE);
    DWORD oldMode;
    GetConsoleMode(hIn, &oldMode);

    DWORD newMode = (oldMode & ~(ENABLE_LINE_INPUT | ENABLE_ECHO_INPUT | ENABLE_PROCESSED_INPUT))
                    | ENABLE_EXTENDED_FLAGS;
    newMode &= ~ENABLE_QUICK_EDIT_MODE;
    SetConsoleMode(hIn, newMode);

    wstring s;
    while (true) {
        INPUT_RECORD rec;
        DWORD read = 0;
        if (!ReadConsoleInputW(hIn, &rec, 1, &read)) break;
        if (rec.EventType != KEY_EVENT) continue;
        if (!rec.Event.KeyEvent.bKeyDown) continue;

        WORD vk = rec.Event.KeyEvent.wVirtualKeyCode;
        wchar_t ch = rec.Event.KeyEvent.uChar.UnicodeChar;
        DWORD ctrl = rec.Event.KeyEvent.dwControlKeyState;
        bool ctrlDown = (ctrl & (LEFT_CTRL_PRESSED | RIGHT_CTRL_PRESSED)) != 0;

        if (vk == VK_RETURN) { wcout << L'\n'; break; }
        if (ctrlDown && (vk == 'C' || vk == 'c')) {
            SetConsoleMode(hIn, oldMode);
            wcout << L"^C\n";
            return L""; 
        }
        if (vk == VK_BACK) {
            if (!s.empty()) { s.pop_back(); wcout << L"\b \b"; wcout.flush(); }
            continue;
        }
        if (ctrlDown && (vk == 'V' || vk == 'v')) {
            wstring clip = GetClipboardText();
            for (wchar_t c : clip) {
                if (c >= 32 && c != 0x7F) {
                    s.push_back(c);
                    wcout << L'*';
                    wcout.flush();
                }
            }
            continue;
        }
        if (ch >= 32 && ch != 0x7F) {
            s.push_back(ch);
            wcout << L'*';
            wcout.flush();
        }
    }

    SetConsoleMode(hIn, oldMode);
    return s;
}

// ================= AI 与 网络部分 =================
bool IsInternetConnected() {
    wcout << L"\n[" << Tr(L"网络检测", L"Network Check") << L"] " << Tr(L"正在尝试连接 api.deepseek.com (HTTPS)...", L"Attempting to connect to api.deepseek.com (HTTPS)...") << endl;
    
    CURL* curl = curl_easy_init();
    if (!curl) return false;

    curl_easy_setopt(curl, CURLOPT_URL, "https://api.deepseek.com");
    curl_easy_setopt(curl, CURLOPT_NOBODY, 1L);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 8L);
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 4L);
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);

    CURLcode res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);

    if (res == CURLE_OK) {
        wcout << L"[" << Tr(L"网络检测", L"Network Check") << L"] " << Tr(L"连接成功，网络可用！", L"Connection successful, network is available!") << endl;
        return true;
    } else {
        wcout << L"[" << Tr(L"网络检测", L"Network Check") << L"] " << Tr(L"连接失败 (", L"Connection failed (") << Utf8ToWide(curl_easy_strerror(res)) << Tr(L")，网络不可用！", L"), network unavailable!") << endl;
        return false;
    }
}

wstring BuildAISummary(const KV& aiData) {
    wostringstream ss;
    ss << Tr(L"以下是这台电脑的硬件配置信息：\n", L"Here is the hardware configuration of this PC:\n");
    for (auto& [k, v] : aiData)
        ss << L"- " << k << L": " << v << L"\n";
    return ss.str();
}

size_t CurlWriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    size_t total = size * nmemb;
    string* s = (string*)userp;
    s->append((char*)contents, total);
    return total;
}

string CallDeepSeek(const string& apiKey, const wstring& aiSummary, wstring& outAnswer) {
    CURL* curl = curl_easy_init();
    if (!curl) return "curl_easy_init failed";

    const string systemPrompt = g_isZh ? 
        "你是一个专业的电脑硬件分析师。用户会提供一台电脑的硬件配置信息。"
        "请用通俗易懂的中文，按以下结构输出分析：\n"
        "1. 性能定位（一句话概括这是一台什么定位的电脑）\n"
        "2. 关键优点（2-3 条）\n"
        "3. 潜在短板（2-3 条）\n"
        "4. 使用建议（3-5 条）\n"
        "要求：只能基于用户提供的数据分析，不要编造未提供的参数；"
        "输出纯文本，不要用 Markdown 格式；每一条不超过 60 字。" 
        : 
        "You are a professional PC hardware analyst. The user will provide hardware configuration info. "
        "Please output the analysis in easy-to-understand English using this structure:\n"
        "1. Performance Positioning (One sentence summarizing what this PC is for)\n"
        "2. Key Pros (2-3 points)\n"
        "3. Potential Cons (2-3 points)\n"
        "4. Recommendations (3-5 points)\n"
        "Requirement: Only analyze based on the provided data, do not make up missing specs. "
        "Output plain text, no Markdown. Max 60 words per point.";

    json requestBody = {
        {"model", "deepseek-chat"},
        {"messages", json::array({
            {{"role", "system"}, {"content", systemPrompt}},
            {{"role", "user"},   {"content", WideToUtf8(aiSummary)}}
        })},
        {"temperature", 0.3},
        {"max_tokens", 2000}
    };
    string body = requestBody.dump();
    string response;

    struct curl_slist* h1 = curl_slist_append(nullptr, "Content-Type: application/json");
    if (!h1) { curl_easy_cleanup(curl); return "Malloc failed (Headers)"; }
    
    string auth = "Authorization: Bearer " + apiKey;
    struct curl_slist* h2 = curl_slist_append(h1, auth.c_str());
    if (!h2) { 
        curl_slist_free_all(h1); 
        curl_easy_cleanup(curl); 
        return "Malloc failed (Headers)"; 
    }

    curl_easy_setopt(curl, CURLOPT_URL, "https://api.deepseek.com/chat/completions");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, h2);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, CurlWriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 90L);
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 15L);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl, CURLOPT_MAXREDIRS, 3L);

    CURLcode res = curl_easy_perform(curl);
    long httpCode = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);

    struct curl_slist* curr = h2;
    while (curr) {
        if (curr->data) SecureZeroMemory(curr->data, strlen(curr->data));
        curr = curr->next;
    }
    SecureZeroMemory(auth.data(), auth.capacity());
    curl_slist_free_all(h2);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) return string(g_isZh ? "网络请求失败：" : "Network request failed: ") + curl_easy_strerror(res);

    if (httpCode != 200) {
        try {
            auto j = json::parse(response);
            if (j.contains("error")) {
                if (j["error"].is_object() && j["error"].contains("message"))
                    return "HTTP " + to_string(httpCode) + ": " + j["error"]["message"].get<string>();
                if (j["error"].is_string())
                    return "HTTP " + to_string(httpCode) + ": " + j["error"].get<string>();
            }
        } catch (...) {}
        return "HTTP " + to_string(httpCode) + (g_isZh ? ": 服务端返回异常" : ": Server returned an error");
    }

    try {
        auto j = json::parse(response);
        if (j.contains("choices") && j["choices"].is_array() && !j["choices"].empty()) {
            string content = j["choices"][0]["message"]["content"].get<string>();
            outAnswer = Utf8ToWide(content);
            return "";
        }
    } catch (const std::exception& e) {
        return string(g_isZh ? "响应解析失败：" : "Response parse failed: ") + e.what();
    }
    return g_isZh ? "响应格式异常" : "Invalid response format";
}

// ================= main =================
int main() {
    _setmode(_fileno(stdout), _O_U16TEXT);
    _setmode(_fileno(stderr), _O_U16TEXT);

    // 获取系统默认 UI 语言
    LANGID langId = GetUserDefaultUILanguage();
    g_isZh = (PRIMARYLANGID(langId) == LANG_CHINESE);

    wstring apiKey;

    if (curl_global_init(CURL_GLOBAL_DEFAULT) != CURLE_OK) {
        wcerr << L"curl_global_init failed\n";
        return 1;
    }

    HRESULT hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    if (FAILED(hr)) { 
        wcerr << L"CoInitializeEx failed\n"; 
        curl_global_cleanup(); 
        return 1; 
    }
    
    CoInitializeSecurity(nullptr, -1, nullptr, nullptr,
        RPC_C_AUTHN_LEVEL_DEFAULT, RPC_C_IMP_LEVEL_IMPERSONATE,
        nullptr, EOAC_NONE, nullptr);

    IWbemLocator* pLoc = nullptr;
    IWbemServices* pSvc = nullptr;
    int exitCode = 0;

    hr = CoCreateInstance(CLSID_WbemLocator, 0, CLSCTX_INPROC_SERVER,
                          IID_IWbemLocator, (LPVOID*)&pLoc);
    if (FAILED(hr)) { 
        wcerr << L"CoCreateInstance failed\n"; 
        CoUninitialize(); 
        curl_global_cleanup(); 
        return 1; 
    }

    hr = pLoc->ConnectServer(_bstr_t(L"ROOT\\CIMV2"), nullptr, nullptr, 0, 0, 0, 0, &pSvc);
    if (FAILED(hr)) { 
        wcerr << L"ConnectServer failed\n"; 
        exitCode = 1; 
        goto cleanup; 
    }
    CoSetProxyBlanket(pSvc, RPC_C_AUTHN_WINNT, RPC_C_AUTHZ_NONE, nullptr,
        RPC_C_AUTHN_LEVEL_CALL, RPC_C_IMP_LEVEL_IMPERSONATE, nullptr, EOAC_NONE);

    {
        KV summary;
        KV aiData;
        wostringstream detail;
        vector<wstring> tips;

        {
            auto sys = QueryAll(pSvc, L"SELECT * FROM Win32_ComputerSystem", { L"Manufacturer", L"Model" });
            if (!sys.empty()) {
                wstring man = sys[0].get(L"Manufacturer");
                wstring mod = sys[0].get(L"Model");
                wstring friendly = MapDeviceModel(man, mod);
                wstring display = friendly.empty() ? (man + L" " + mod) : friendly;
                summary.push_back({Tr(L"型号", L"Model"), display});
                aiData.push_back({Tr(L"型号", L"Model"), display});
            }
        }
        {
            auto os = QueryAll(pSvc, L"SELECT * FROM Win32_OperatingSystem", { L"Caption", L"Version", L"BuildNumber", L"OSArchitecture", L"InstallDate" });
            if (!os.empty()) {
                auto& o = os[0];
                detail << L"\n[" << Tr(L"操作系统", L"OS") << L"]\n";
                detail << L"  " << Tr(L"版本   : ", L"Version : ") << o.get(L"Caption") << L"\n";
                detail << L"  " << Tr(L"内核   : ", L"Kernel  : ") << o.get(L"Version") << L" (Build " << o.get(L"BuildNumber") << L")\n";
                detail << L"  " << Tr(L"架构   : ", L"Arch    : ") << o.get(L"OSArchitecture") << L"\n";
                detail << L"  " << Tr(L"安装于 : ", L"Install : ") << FormatWmiDate(o.get(L"InstallDate")) << L"\n";
                wstring osStr = o.get(L"Caption") + L" (Build " + o.get(L"BuildNumber") + L")";
                summary.push_back({Tr(L"系统", L"OS"), osStr});
                aiData.push_back({Tr(L"系统", L"OS"), osStr});
                if (o.get(L"Caption").find(L"Insider Preview") != wstring::npos)
                    tips.push_back(Tr(L"当前系统是 Windows Insider 预览版，遇到驱动 / 游戏 / 模拟器兼容问题时优先怀疑系统版本。",
                                      L"Windows Insider Preview detected. If you encounter driver/game/emulator issues, suspect the OS version first."));
            }
        }

        AnalyzeCPU(pSvc, summary, aiData, detail, tips);
        int resW = 0, resH = 0;
        AnalyzeGPU(pSvc, resW, resH, summary, aiData, detail, tips);
        AnalyzeMemory(pSvc, summary, aiData, detail, tips);
        AnalyzeDisk(pSvc, summary, aiData, detail, tips);
        AnalyzeBoardBios(pSvc, summary, aiData, detail, tips);
        AnalyzeMonitor(pSvc, pLoc, resW, resH, summary, aiData, detail, tips);
        AnalyzeNetwork(pSvc, summary, aiData, detail, tips);
        AnalyzeSound(pSvc, summary, aiData, detail, tips);
        AnalyzeBattery(pSvc, summary, aiData, detail, tips);

        wcout << L"==============================================\n";
        wcout << L"            " << Tr(L"设备硬件详细信息", L"Hardware Information") << L"\n";
        wcout << L"==============================================\n";
        wcout << L"\n[" << Tr(L"设备概况", L"Overview") << L"]\n";
        for (auto& [k, v] : summary)
            wcout << L"  " << k << L" : " << v << L"\n";

        wcout << detail.str();

        if (!tips.empty()) {
            wcout << L"\n[" << Tr(L"本地建议", L"Local Recommendations") << L"]\n";
            for (size_t i = 0; i < tips.size(); ++i)
                wcout << L"  " << (i+1) << L". " << tips[i] << L"\n";
        }

        wcout << L"\n==============================================\n";
        wcout << Tr(L"本地扫描完成", L"Local scan complete") << L"\n";
        wcout << L"==============================================\n";

        bool hasNet = IsInternetConnected();

        if (!hasNet) {
            wcout << L"\n[" << Tr(L"提示", L"Notice") << L"] " << Tr(L"当前设备无法连接到外网，AI 解读不可用。", L"Device cannot connect to the internet. AI analysis unavailable.") << L"\n";
            wcout << Tr(L"已跳过 AI 解读，仅输出本地扫描结果。\n", L"Skipped AI analysis, local results only.\n");
            goto cleanup;
        }

        wcout << L"\n" << Tr(L"是否进行 AI 解读？（需输入 API Key，目前仅支持 DeepSeek）[Y/N/Q]: ", L"Do you want AI analysis? (Requires API Key, DeepSeek only) [Y/N/Q]: ");
        wchar_t choice = ReadChoice();

        if (choice == L'N' || choice == L'Q') {
            wcout << L"\n" << Tr(L"已跳过 AI 解读，程序退出。\n", L"Skipped AI analysis. Exiting.\n");
            goto cleanup;
        }

        wcout << L"\n" << Tr(L"请输入 DeepSeek API Key（边输入/粘贴边显示 *，回车确认）：\n> ", L"Please enter DeepSeek API Key (masked with *, press Enter to confirm):\n> ");
        apiKey = ReadPassword();
        
        if (apiKey.empty()) {
            wcout << L"\n" << Tr(L"未输入 Key 或主动取消，已退出。\n", L"No Key entered or cancelled. Exiting.\n");
            goto cleanup;
        }

        wcout << L"\n" << Tr(L"正在请求 DeepSeek 分析，请稍候...\n", L"Requesting DeepSeek analysis, please wait...\n");

        {
            wstring aiSummary = BuildAISummary(aiData);
            wstring aiAnswer;
            string err = CallDeepSeek(WideToUtf8(apiKey), aiSummary, aiAnswer);

            if (!err.empty()) {
                wcout << L"\n[" << Tr(L"AI 解读失败", L"AI Analysis Failed") << L"] " << Utf8ToWide(err) << L"\n";
            } else {
                wcout << L"\n==============================================\n";
                wcout << L"            " << Tr(L"AI 硬件解读（DeepSeek）", L"AI Hardware Analysis (DeepSeek)") << L"\n";
                wcout << L"==============================================\n\n";
                wcout << aiAnswer << L"\n";
                wcout << L"\n==============================================\n";
            }
        }
    }

// 注意：此处的 goto 跨越了上面拥有析构函数的作用域（如 KV, wostringstream 等），
// 这是为了统一释放 COM 指针和 curl 全局状态。
// 请勿在 goto 的作用域内新增需要 RAII 管理的对象，否则会跳过析构。
cleanup:
    if (!apiKey.empty()) {
        SecureZeroMemory(apiKey.data(), apiKey.capacity() * sizeof(wchar_t));
    }

    if (pSvc) pSvc->Release();
    if (pLoc) pLoc->Release();
    CoUninitialize();
    curl_global_cleanup();
    return exitCode;
}