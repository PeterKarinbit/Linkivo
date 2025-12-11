📝 [update-1758802892905-5fipho9u] Generating update prompt
🤖 [update-1758802892905-5fipho9u] Calling DeepSeek API (attempt 1 of 3)
Initializing OpenAI-compatible client...
Initializing Vector DB...
Initializing Market Intelligence Service...
Initializing OpenAI-compatible client...
Initializing ChromaDB client...

<--- Last few GCs --->

[14106:0x37073ca0]    67938 ms: Scavenge 2037.3 (2077.2) -> 2036.6 (2081.7) MB, 14.6 / 0.0 ms  (average mu = 0.173, current mu = 0.037) allocation failure; 
[14106:0x37073ca0]    67965 ms: Scavenge 2039.8 (2081.7) -> 2038.3 (2082.5) MB, 19.2 / 0.0 ms  (average mu = 0.173, current mu = 0.037) allocation failure; 
[14106:0x37073ca0]    67992 ms: Scavenge 2040.4 (2082.5) -> 2039.2 (2084.0) MB, 19.3 / 0.0 ms  (average mu = 0.173, current mu = 0.037) allocation failure; 


<--- JS stacktrace --->

FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
 1: 0xb9bbf0 node::Abort() [/usr/bin/node]
 2: 0xaa27ee  [/usr/bin/node]
 3: 0xd734a0 v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [/usr/bin/node]
 4: 0xd73847 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [/usr/bin/node]
 5: 0xf50c55  [/usr/bin/node]
 6: 0xf51b58 v8::internal::Heap::RecomputeLimits(v8::internal::GarbageCollector) [/usr/bin/node]
 7: 0xf62053  [/usr/bin/node]
 8: 0xf62ec8 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags) [/usr/bin/node]
 9: 0xf66095 v8::internal::Heap::HandleGCRequest() [/usr/bin/node]
10: 0xee41ff v8::internal::StackGuard::HandleInterrupts() [/usr/bin/node]
11: 0x12e4975 v8::internal::Runtime_StackGuard(int, unsigned long*, v8::internal::Isolate*) [/usr/bin/node]
12: 0x1711cb9  [/usr/bin/node]
[nodemon] app crashed - waiting for file changes before starting...


