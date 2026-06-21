# Graph Report - .  (2026-06-20)

## Corpus Check
- Large corpus: 368 files � ~539,877 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1836 nodes · 4326 edges · 129 communities (97 shown, 32 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 195 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes & Auth|API Routes & Auth]]
- [[_COMMUNITY_Characters Module|Characters Module]]
- [[_COMMUNITY_D&D Rules Engine|D&D Rules Engine]]
- [[_COMMUNITY_Content Infrastructure|Content Infrastructure]]
- [[_COMMUNITY_User Profiles|User Profiles]]
- [[_COMMUNITY_Result Pattern|Result Pattern]]
- [[_COMMUNITY_Content Packs Domain|Content Packs Domain]]
- [[_COMMUNITY_Pack Management UI|Pack Management UI]]
- [[_COMMUNITY_DM Session Frontend|DM Session Frontend]]
- [[_COMMUNITY_Content Value Objects|Content Value Objects]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Character Components|Character Components]]
- [[_COMMUNITY_Protected Pages|Protected Pages]]
- [[_COMMUNITY_Asset Form Components|Asset Form Components]]
- [[_COMMUNITY_DM Session Repository|DM Session Repository]]
- [[_COMMUNITY_Pack Form Components|Pack Form Components]]
- [[_COMMUNITY_Monorepo Config|Monorepo Config]]
- [[_COMMUNITY_RunPod DM Adapter|RunPod DM Adapter]]
- [[_COMMUNITY_Drizzle Schema Types|Drizzle Schema Types]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Asset Domain|Asset Domain]]
- [[_COMMUNITY_Race & Ability Forms|Race & Ability Forms]]
- [[_COMMUNITY_Campaign Entities|Campaign Entities]]
- [[_COMMUNITY_MAS Agent Pipeline|MAS Agent Pipeline]]
- [[_COMMUNITY_Character Detail Cards|Character Detail Cards]]
- [[_COMMUNITY_Auth Context|Auth Context]]
- [[_COMMUNITY_Campaign Domain|Campaign Domain]]
- [[_COMMUNITY_Campaign Members|Campaign Members]]
- [[_COMMUNITY_DM Orchestrator Config|DM Orchestrator Config]]
- [[_COMMUNITY_DM Turn Repository|DM Turn Repository]]
- [[_COMMUNITY_App Layout|App Layout]]
- [[_COMMUNITY_Blackboard Pattern|Blackboard Pattern]]
- [[_COMMUNITY_DnD Rules Package|DnD Rules Package]]
- [[_COMMUNITY_Frontend TS Config|Frontend TS Config]]
- [[_COMMUNITY_Landing Dependencies|Landing Dependencies]]
- [[_COMMUNITY_SRD Data Types|SRD Data Types]]
- [[_COMMUNITY_DM Session Errors|DM Session Errors]]
- [[_COMMUNITY_Equipment Form|Equipment Form]]
- [[_COMMUNITY_Backend TS Config|Backend TS Config]]
- [[_COMMUNITY_Node TS Config|Node TS Config]]
- [[_COMMUNITY_SRD Seeder Service|SRD Seeder Service]]
- [[_COMMUNITY_DM Turn Domain|DM Turn Domain]]
- [[_COMMUNITY_DnD Rules Config|DnD Rules Config]]
- [[_COMMUNITY_App Bootstrap|App Bootstrap]]
- [[_COMMUNITY_NPC Agent|NPC Agent]]
- [[_COMMUNITY_CampaignCharacter Pages|Campaign/Character Pages]]
- [[_COMMUNITY_Pod Server|Pod Server]]
- [[_COMMUNITY_Product Backlog|Product Backlog]]
- [[_COMMUNITY_Campaign Repository|Campaign Repository]]
- [[_COMMUNITY_Campaign Status|Campaign Status]]
- [[_COMMUNITY_Campaign Member Entity|Campaign Member Entity]]
- [[_COMMUNITY_Character Wizard|Character Wizard]]
- [[_COMMUNITY_Campaign Drizzle Repo|Campaign Drizzle Repo]]
- [[_COMMUNITY_Landing Page Sections|Landing Page Sections]]
- [[_COMMUNITY_Landing Components|Landing Components]]
- [[_COMMUNITY_Architecture Decisions|Architecture Decisions]]
- [[_COMMUNITY_Monolithic DM Mode|Monolithic DM Mode]]
- [[_COMMUNITY_Orchestrator Dependencies|Orchestrator Dependencies]]
- [[_COMMUNITY_DM Session Pages|DM Session Pages]]
- [[_COMMUNITY_Worker Config|Worker Config]]
- [[_COMMUNITY_Memory Extraction|Memory Extraction]]
- [[_COMMUNITY_RunPod Handler|RunPod Handler]]
- [[_COMMUNITY_Image Processing|Image Processing]]
- [[_COMMUNITY_Dev Script|Dev Script]]
- [[_COMMUNITY_Strategic Context|Strategic Context]]
- [[_COMMUNITY_Memory Layers|Memory Layers]]
- [[_COMMUNITY_CI Pipeline|CI Pipeline]]
- [[_COMMUNITY_DM Model Request|DM Model Request]]
- [[_COMMUNITY_Model Loader|Model Loader]]
- [[_COMMUNITY_Procedural Memory|Procedural Memory]]
- [[_COMMUNITY_TSConfig Base|TSConfig Base]]
- [[_COMMUNITY_Pack Test Helpers|Pack Test Helpers]]
- [[_COMMUNITY_Build Config|Build Config]]
- [[_COMMUNITY_Model Module|Model Module]]
- [[_COMMUNITY_TSConfig Refs|TSConfig Refs]]
- [[_COMMUNITY_Test Metadata|Test Metadata]]
- [[_COMMUNITY_Frontend README|Frontend README]]
- [[_COMMUNITY_Image Utils|Image Utils]]
- [[_COMMUNITY_Stream State|Stream State]]
- [[_COMMUNITY_Drizzle Config|Drizzle Config]]
- [[_COMMUNITY_useAuth Hook|useAuth Hook]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Confirm Modal|Confirm Modal]]
- [[_COMMUNITY_Backend README|Backend README]]
- [[_COMMUNITY_Landing README|Landing README]]
- [[_COMMUNITY_API Health Check|API Health Check]]
- [[_COMMUNITY_getUser Helper|getUser Helper]]
- [[_COMMUNITY_Session Helper|Session Helper]]
- [[_COMMUNITY_Constants|Constants]]
- [[_COMMUNITY_CR to XP|CR to XP]]
- [[_COMMUNITY_Format CR|Format CR]]
- [[_COMMUNITY_Name Index|Name Index]]
- [[_COMMUNITY_Backend Ref|Backend Ref]]
- [[_COMMUNITY_Form Fields Index|Form Fields Index]]
- [[_COMMUNITY_Neighbors Helper|Neighbors Helper]]
- [[_COMMUNITY_Rules Ref|Rules Ref]]
- [[_COMMUNITY_Budget Constant|Budget Constant]]
- [[_COMMUNITY_Proficiency Bonus|Proficiency Bonus]]
- [[_COMMUNITY_XP Range|XP Range]]
- [[_COMMUNITY_Security Config|Security Config]]
- [[_COMMUNITY_Hooks Config|Hooks Config]]
- [[_COMMUNITY_Draft Persistence|Draft Persistence]]
- [[_COMMUNITY_CN Utility|CN Utility]]

## God Nodes (most connected - your core abstractions)
1. `UUID` - 117 edges
2. `Result` - 90 edges
3. `ContentPack` - 51 edges
4. `ContentPackRepository` - 51 edges
5. `DmSession` - 50 edges
6. `Asset` - 44 edges
7. `UserProfile` - 43 edges
8. `Slug` - 41 edges
9. `AssetRepository` - 40 edges
10. `authFetch()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `DemoSection` --references--> `RAG Memory System`  [INFERRED]
  apps/landing/src/components/landing/DemoSection.astro → context/agent-context.md
- `FeaturesSection` --references--> `DM Copilot Philosophy`  [INFERRED]
  apps/landing/src/components/landing/FeaturesSection.astro → CLAUDE.md
- `VisionSection` --conceptually_related_to--> `Accessibility Radical (Web-Based)`  [INFERRED]
  apps/landing/src/components/landing/VisionSection.astro → context/agent-context.md
- `FeaturesSection` --references--> `Steam Workshop Model (Marketplace)`  [INFERRED]
  apps/landing/src/components/landing/FeaturesSection.astro → context/agent-context.md
- `PricingSection` --implements--> `Freemium Model`  [INFERRED]
  apps/landing/src/components/landing/PricingSection.astro → context/agent-context.md

## Import Cycles
- 3-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`
- 4-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/RaceForm.tsx -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`
- 4-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/BackgroundForm.tsx -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`
- 4-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/ClassForm.tsx -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`
- 4-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/EquipmentForm.tsx -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`
- 4-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/FeatForm.tsx -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`
- 4-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/GenericAssetForm.tsx -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`
- 4-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/MagicItemForm.tsx -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`
- 4-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/MonsterForm.tsx -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`
- 4-file cycle: `apps/frontend/src/components/features/packs/AddAssetModal.tsx -> apps/frontend/src/components/features/packs/asset-forms/index.ts -> apps/frontend/src/components/features/packs/asset-forms/SpellForm.tsx -> apps/frontend/src/components/features/packs/asset-forms/types.ts -> apps/frontend/src/components/features/packs/AddAssetModal.tsx`

## Hyperedges (group relationships)
- **Content domain application use cases** — get-asset.use-case_GetAssetUseCase, get-pack.use-case_GetPackUseCase, list-assets.use-case_ListAssetsUseCase, list-packs.use-case_ListPacksUseCase, resolve-asset.use-case_ResolveAssetUseCase, suspend-pack.use-case_SuspendPackUseCase, unsuspend-pack.use-case_UnsuspendPackUseCase, update-asset.use-case_UpdateAssetUseCase, update-pack.use-case_UpdatePackUseCase [INFERRED]
- **Content domain value objects** — asset-data.vo_AssetData, asset-type.vo_AssetType, pack-status.vo_PackStatus, pack-type.vo_PackType [INFERRED]
- **Content domain entity aggregate** — asset.entity_Asset, content-pack.entity_ContentPack [INFERRED]
- **Content domain repository interfaces** — asset.repository_AssetRepository, content-pack.repository_ContentPackRepository [INFERRED]
- **** — get_user_profile_GetUserProfileUseCase, search_users_SearchUsersUseCase, update_user_profile_UpdateUserProfileUseCase, update_user_role_UpdateUserRoleUseCase [EXTRACTED 1.00]
- **** — arbiter_run_arbiter, memory_agent_run_memory_agent, narrator_run_narrator, narrator_stream_narrator [EXTRACTED 1.00]
- **** — slug_vo_Slug, uuid_vo_UUID [EXTRACTED 1.00]
- **Memory Layer System** — l2_episodic_save_episode, l2_episodic_retrieve_relevant_episodes, l3_semantic_load_graph, l3_semantic_update_from_extraction, l4_procedural_query_rules [INFERRED 0.95]
- **DM Session API Client** — dmSessionApi_createSession, dmSessionApi_getSessions, dmSessionApi_getSession, dmSessionApi_sendTurn, dmSessionApi_getMetrics, dmSessionApi_simulateTurn, dmSessionApi_endSession, dmSessionApi_deleteSession [INFERRED 0.95]
- **Orchestrator Mode System** — mas_run, monolithic_run, schemas_DmModelRequest [INFERRED 0.95]
- **Frontend Auth System** — AuthContext_AuthProvider, AuthContext_useAuth, api_authFetch, auth_getToken, auth_clearSession, auth_setSession [INFERRED 0.95]
- **SSE Chunk Types** — schemas_DeltaChunk, schemas_MetadataChunk, schemas_DoneChunk, schemas_ErrorChunk, schemas_SseChunk [EXTRACTED 1.00]
- **Frontend Routing & App Setup** — main_entrypoint, App_App, router_router, AuthContext_AuthProvider [EXTRACTED 1.00]
- **** — CampaignDetails_CampaignDetails, Campaigns_Campaigns, CreateCampaign_CreateCampaign, EditCampaign_EditCampaign, campaigns.api_CampaignService, campaigns.api_Campaign [INFERRED 0.95]
- **** — CharacterDetail_CharacterDetail, Characters_Characters, CreateCharacter_CreateCharacter, characters.api_CharacterService, characters.api_Character, characters.api_MyCharacter [INFERRED 0.95]
- **** — Library_Library, PackDetails_PackDetails, CreatePack_CreatePack, EditPack_EditPack, Marketplace_Marketplace, api_PackService, api_Pack [INFERRED 0.95]
- **** — DmSession_DmSession, DmSessions_DmSessions, DmSessions_ArchitectureBadge, DmSessions_StatusBadge [INFERRED 0.95]
- **** — Login_Login, Register_Register, Profile_Profile, ProtectedRoute_ProtectedRoute, AuthActionGuard_AuthActionGuard, GuestBanner_GuestBanner [INFERRED 0.95]
- **** — AppLayout_AppLayout, Sidebar_Sidebar, ProtectedRoute_ProtectedRoute, GuestBanner_GuestBanner, AuthActionGuard_AuthActionGuard [INFERRED 0.95]

## Communities (129 total, 32 thin omitted)

### Community 0 - "API Routes & Auth"
Cohesion: 0.05
Nodes (58): assetsRoutes, authRoutes, extractJwtUser(), requireOwnerOrAdmin(), requireRole(), requireUser(), getKey(), signToken() (+50 more)

### Community 1 - "Characters Module"
Cohesion: 0.05
Nodes (27): CharacterError, Character Entity, CharacterError Enum, CharacterRepository Interface, CharacterStatus Value Object, CharacterDrizzleRepository, toDomain(), Character (+19 more)

### Community 2 - "D&D Rules Engine"
Cohesion: 0.07
Nodes (55): StatCounter, dnd-rules (package entry), CreateCharacter(), calculateHitPoints, calculateModifier, calculatePointBuyCost, validatePointBuy, resolveChoice (+47 more)

### Community 3 - "Content Infrastructure"
Cohesion: 0.07
Nodes (15): AssetDrizzleRepository, Row, toDomain(), Asset, CreateAssetProps, ReconstructAssetProps, BaseEntity, AssetFilters (+7 more)

### Community 4 - "User Profiles"
Cohesion: 0.08
Nodes (13): toDomain(), UserProfileDrizzleRepository, CampaignMemberProps, UserProfile, UserProfileProps, UserProfileRepository, GetUserProfileUseCase, SearchUsersDto (+5 more)

### Community 5 - "Result Pattern"
Cohesion: 0.14
Nodes (7): Result, CreateContentPackProps, ReconstructContentPackProps, ASSET_REPOSITORY, CONTENT_PACK_REPOSITORY, UpdateCampaignDto, Slug

### Community 6 - "Content Packs Domain"
Cohesion: 0.08
Nodes (13): PackError, PackError Enum, ContentPackDrizzleRepository, Row, toDomain(), ContentPack, ContentPackFilters, ChangePackStatusUseCase (+5 more)

### Community 7 - "Pack Management UI"
Cohesion: 0.09
Nodes (33): ManagePacksModal(), ManagePacksModalProps, PackItemProps, MemberCard(), MemberCardProps, UserSearch(), UserSearchProps, UserSearchResult (+25 more)

### Community 8 - "DM Session Frontend"
Cohesion: 0.09
Nodes (30): CharacterSnapshot (FE), SessionInitModal(), SessionInitModalProps, ArchitectureType, CharacterSnapshot, CreateDmSessionRequest, createSession(), deleteSession() (+22 more)

### Community 9 - "Content Value Objects"
Cohesion: 0.06
Nodes (7): SystemType Test, PackStatus, PackStatusValue, VALID_TRANSITIONS, PackType, SystemType, SystemTypeValue

### Community 10 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (42): dependencies, clsx, date-fns, lodash, lucide-react, @questmasters/dnd-rules, react, react-dom (+34 more)

### Community 11 - "Character Components"
Cohesion: 0.09
Nodes (33): AssetCard, CharacterCard, CharacterCreationWizard, ImageCropModal, ManagePacksModal, PackItem, MemberCard, PackCard (+25 more)

### Community 12 - "Protected Pages"
Cohesion: 0.10
Nodes (31): AuthActionGuard, CreatePack, EditPack, GuestBanner, Library, PackDetails, ProtectedRoute, Asset (api.ts) (+23 more)

### Community 13 - "Asset Form Components"
Cohesion: 0.13
Nodes (27): BackgroundForm(), StartingEquipmentEntry, ClassForm(), HIT_DICE, StartingEquipmentEntry, FeatForm(), Prerequisite, GenericAssetForm() (+19 more)

### Community 14 - "DM Session Repository"
Cohesion: 0.10
Nodes (15): DmSessionDrizzleRepository, Row, toDomain(), CharacterSnapshot, CreateDmSessionProps, DmSession, DmSessionStatus, ReconstructDmSessionProps (+7 more)

### Community 15 - "Pack Form Components"
Cohesion: 0.10
Nodes (29): AddAssetModal, AssetFormPanel, CollapsibleAssetCategory, PackForm, getAssetForm, getFormLayout, getAssetForm(), getFormLayout() (+21 more)

### Community 16 - "Monorepo Config"
Cohesion: 0.06
Nodes (32): devDependencies, prettier, turbo, typescript, engines, node, name, packageManager (+24 more)

### Community 17 - "RunPod DM Adapter"
Cohesion: 0.15
Nodes (12): PythonChunk, RunpodDmModelAdapter, RunpodJobResponse, RunpodStreamEvent, StubDmModelAdapter, formatEntry(), log(), LogEntry (+4 more)

### Community 18 - "Drizzle Schema Types"
Cohesion: 0.07
Nodes (29): AllValuesOf, AnyEntryMap, CollectionEntry, CollectionKey, ContentCollectionKey, ContentConfig, ContentEntryMap, DataCollectionKey (+21 more)

### Community 19 - "Backend Dependencies"
Cohesion: 0.07
Nodes (29): author, dependencies, drizzle-orm, hono, jose, @questmasters/dnd-rules, zod, description (+21 more)

### Community 20 - "Asset Domain"
Cohesion: 0.17
Nodes (12): AssetError, AssetError Enum, AssetRepository, ContentPackRepository, CreateAssetUseCase, CreatePackUseCase, DeleteAssetUseCase, GetAssetUseCase (+4 more)

### Community 21 - "Race & Ability Forms"
Cohesion: 0.14
Nodes (18): AbilityBonus, AbilityBonusList(), AbilityBonusListProps, ActionEditor(), ActionEditorProps, MonsterAction, DescriptionArrayFieldProps, FormField() (+10 more)

### Community 22 - "Campaign Entities"
Cohesion: 0.19
Nodes (23): Campaign Entity, CampaignError Enum, CampaignMember Entity, CampaignMemberRepository Interface, CampaignRepository Interface, CampaignStatus Value Object, CampaignStatus VO Test, CreateCampaignUseCase Test (+15 more)

### Community 23 - "MAS Agent Pipeline"
Cohesion: 0.17
Nodes (22): _build_prompt(), run_arbiter(), _build_prompt(), Versión síncrona para uso en nodos LangGraph (sin streaming)., run_narrator(), stream_narrator(), Any, Blackboard (+14 more)

### Community 24 - "Character Detail Cards"
Cohesion: 0.12
Nodes (18): AssetCard(), AssetCardProps, CharacterCard(), CharacterCardProps, StatCounter(), StatCounterProps, ALIGNMENTS, CreationMode (+10 more)

### Community 25 - "Auth Context"
Cohesion: 0.13
Nodes (16): AuthContext, AuthContextType, AuthProvider(), UserProfile, NavItem(), NavItemProps, Sidebar(), AuthUser (+8 more)

### Community 26 - "Campaign Domain"
Cohesion: 0.12
Nodes (5): CampaignError, Campaign, CreateCampaignProps, ReconstructCampaignProps, CampaignMapper

### Community 27 - "Campaign Members"
Cohesion: 0.11
Nodes (6): CampaignMemberDrizzleRepository, MemberRow, toDomain(), UserRow, CampaignMember, UserProfile Entity (users)

### Community 28 - "DM Orchestrator Config"
Cohesion: 0.17
Nodes (23): run_arbiter, Config, _build_initial_state, _build_prep_graph, mas.run, run_memory_agent, _load_model, get_input_device (+15 more)

### Community 29 - "DM Turn Repository"
Cohesion: 0.18
Nodes (12): DmTurnDrizzleRepository, ArchitectureType, NarrativeNote, CreateDmTurnProps, DmTurn, ReconstructDmTurnProps, DmTurnMapper, DmSessionWithTurns (+4 more)

### Community 30 - "App Layout"
Cohesion: 0.10
Nodes (11): AppLayout(), ProtectedRoute(), CampaignDetails(), Campaigns(), ALIGNMENT_LABELS, CharacterDetail(), ConfirmDeleteModalProps, STAT_LABELS (+3 more)

### Community 31 - "Blackboard Pattern"
Cohesion: 0.38
Nodes (21): Blackboard, DmModelRequest, SseChunk, DeltaChunk, DmModelRequest, SseChunk, AutoModel, AutoTokenizer (+13 more)

### Community 32 - "DnD Rules Package"
Cohesion: 0.09
Nodes (21): author, dependencies, zod, description, devDependencies, eslint, tsup, typescript (+13 more)

### Community 33 - "Frontend TS Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 34 - "Landing Dependencies"
Cohesion: 0.09
Nodes (21): dependencies, astro, @astrojs/react, @astrojs/tailwind, clsx, lucide-react, react, react-dom (+13 more)

### Community 35 - "SRD Data Types"
Cohesion: 0.16
Nodes (19): Any, Collection, Path, Any, Path, Connection, DiGraph, _chroma_collection() (+11 more)

### Community 36 - "DM Session Errors"
Cohesion: 0.15
Nodes (7): DmSessionError, createContainer, EndDmSessionUseCase, GetDmSessionUseCase, ListDmSessionsDto, ListDmSessionsUseCase, SoftDeleteDmSessionUseCase

### Community 37 - "Equipment Form"
Cohesion: 0.13
Nodes (15): EquipmentForm(), WEAPON_CATEGORIES, WEAPON_RANGES, SPELL_LEVELS, SpellForm(), CollapsibleSection(), CollapsibleSectionProps, Cost (+7 more)

### Community 38 - "Backend TS Config"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, declaration, forceConsistentCasingInFileNames, module, moduleResolution, noImplicitAny, outDir (+11 more)

### Community 39 - "Node TS Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 40 - "SRD Seeder Service"
Cohesion: 0.16
Nodes (7): AssetEntry, PACKS, SRD_DATA, SrdSeederService, AssetType, AssetTypeValue, PackTypeValue

### Community 41 - "DM Turn Domain"
Cohesion: 0.30
Nodes (10): DmTurnRole, DmModelProvider, DmSessionRepository, DM_TURN_REPOSITORY, DmTurnRepository, streamAndPersistTurn, InitializeDmSessionDto, InitializeDmSessionUseCase (+2 more)

### Community 42 - "DnD Rules Config"
Cohesion: 0.11
Nodes (17): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, incremental, lib, module (+9 more)

### Community 43 - "App Bootstrap"
Cohesion: 0.15
Nodes (17): App, AuthProvider, authFetch, clearSession, getToken, createSession, deleteSession, endSession (+9 more)

### Community 44 - "NPC Agent"
Cohesion: 0.15
Nodes (13): _build_npc_prompt(), _generate_one(), run_npc(), Any, Blackboard, Any, PreTrainedTokenizerBase, _build_prep_graph() (+5 more)

### Community 45 - "Campaign/Character Pages"
Cohesion: 0.29
Nodes (16): CampaignDetails, Campaigns, CharacterDetail, Characters, CreateCampaign, CreateCharacter, EditCampaign, Campaign (frontend) (+8 more)

### Community 46 - "Pod Server"
Cohesion: 0.24
Nodes (13): Any, Queue, _build_messages(), _camel_to_snake(), CharacterSnapshot, _clean_response(), _convert_keys(), DmModelRequest (+5 more)

### Community 47 - "Product Backlog"
Cohesion: 0.17
Nodes (16): Product Backlog, Point Buy System (27 pts), Steam Workshop Model (Marketplace), WebSocket Last-Write-Wins, EPIC 0: Infrastructure, EPIC 10: Game Finder, EPIC 12: Advanced UX, EPIC 1: Auth & Security (+8 more)

### Community 48 - "Campaign Repository"
Cohesion: 0.18
Nodes (5): CAMPAIGN_REPOSITORY, CampaignFilters, CampaignRepository, CreateCampaignDto, ListCampaignsUseCase

### Community 50 - "Campaign Member Entity"
Cohesion: 0.19
Nodes (3): CampaignMemberRepository, InvitePlayerDto, RemoveMemberDto

### Community 51 - "Character Wizard"
Cohesion: 0.17
Nodes (10): CharacterCreationWizard(), CreationMode, DndSystem, MODES, Pack, Props, SYSTEMS, Characters() (+2 more)

### Community 52 - "Campaign Drizzle Repo"
Cohesion: 0.15
Nodes (8): Dev Server Script, CampaignDrizzleRepository, toDomain(), Drizzle ORM Config, AppDb Connection Type, DB Schema (Drizzle), @questmasters/dnd-rules Package, Backend Package.json

### Community 53 - "Landing Page Sections"
Cohesion: 0.15
Nodes (13): CTASection, DemoSection, FAQSection, FeaturesSection, Footer, HeroSection, Layout, Navigation (+5 more)

### Community 54 - "Landing Components"
Cohesion: 0.15
Nodes (12): ../components/landing/CTASection.astro, ../components/landing/DemoSection.astro, ../components/landing/FAQSection.astro, ../components/landing/FeaturesSection.astro, ../components/landing/Footer.astro, ../components/landing/HeroSection.astro, ../components/landing/Navigation.astro, ../components/landing/PricingSection.astro (+4 more)

### Community 55 - "Architecture Decisions"
Cohesion: 0.23
Nodes (12): ProjectConfig, DDD Architecture, DM Copilot Philosophy, Hono Not NestJS, Hybrid AI Architecture (Copilot), Logic Layer (Hard-Coded Rules), Domain Modules, Narrative Layer (LLM) (+4 more)

### Community 56 - "Monolithic DM Mode"
Cohesion: 0.38
Nodes (11): _build_messages(), _embedding_func(), _format_character(), _get_embed_model(), _get_lightrag(), _insert_turn(), _is_opening_turn(), _lightrag_working_dir() (+3 more)

### Community 57 - "Orchestrator Dependencies"
Cohesion: 0.22
Nodes (11): RAG Memory System, bitsandbytes, chromadb, fastapi, langgraph, lightrag-hku, peft, pydantic (+3 more)

### Community 58 - "DM Session Pages"
Cohesion: 0.20
Nodes (10): AppLayout, DmSession, ArchitectureBadge, DmSessions, StatusBadge (DmSessions), Login, Marketplace, Profile (+2 more)

### Community 59 - "Worker Config"
Cohesion: 0.33
Nodes (10): README, Cloudflare D1 (SQLite), Cloudflare R2 (Objects), Gemma 4 26B-A4B-it Model, JWT HS256 Auth (jose), Migration: Users Tables, Migration: Content Packs Tables, Migration: Campaigns Tables (+2 more)

### Community 60 - "Memory Extraction"
Cohesion: 0.22
Nodes (10): _build_prompt, _parse_json, run_extraction, retrieve_relevant_episodes, save_episode, load_graph, save_graph, update_from_extraction (+2 more)

### Community 61 - "RunPod Handler"
Cohesion: 0.28
Nodes (9): DmModelRequest (Python import), ErrorChunk (Python import), handler (RunPod), CharacterSnapshot (pod_server), DmModelRequest (pod_server), pod_server FastAPI app, _build_messages, _generate_to_queue (+1 more)

### Community 62 - "Image Processing"
Cohesion: 0.36
Nodes (5): cropImageToWebP(), loadImage(), CreateCampaign(), ImageCropModal(), ImageCropModalProps

### Community 63 - "Dev Script"
Cohesion: 0.29
Nodes (6): BACKEND_KEYS, DEV_VARS, findFreePort(), isPortFree(), proc, ROOT_ENV

### Community 64 - "Strategic Context"
Cohesion: 0.33
Nodes (7): Agent Context (Strategic Vision), Accessibility Radical (Web-Based), Freemium Model, Project Sigil Lessons, PWA (Progressive Web App), Theater of Mind Mode, Voice UI (STT/TTS)

### Community 65 - "Memory Layers"
Cohesion: 0.57
Nodes (6): _retrieve_l2(), _retrieve_l3(), _retrieve_l4(), run_memory_agent(), Any, Blackboard

### Community 66 - "CI Pipeline"
Cohesion: 0.29
Nodes (7): CI Job API, CI Job Client, CI Job DnD Rules, CI Workflow, Bun Runtime, Turborepo, Turbo Config

### Community 67 - "DM Model Request"
Cohesion: 0.53
Nodes (5): DmModelRequest, handler(), Entry point de RunPod Serverless. Genera chunks SSE como stream., _run_mode(), ErrorChunk

### Community 69 - "Procedural Memory"
Cohesion: 0.67
Nodes (3): Collection, query_rules(), _srd_collection()

### Community 70 - "TSConfig Base"
Cohesion: 0.50
Nodes (3): exclude, extends, include

### Community 71 - "Pack Test Helpers"
Cohesion: 0.83
Nodes (3): generate_random_slug(), generate_valid_pack_payload(), test_suspend_existing_pack()

### Community 73 - "Model Module"
Cohesion: 0.67
Nodes (3): src.config, download_base_model, download_loras

## Knowledge Gaps
- **473 isolated node(s):** `name`, `version`, `type`, `description`, `author` (+468 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CreateCharacter()` connect `D&D Rules Engine` to `Character Detail Cards`, `App Layout`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `DmSession` (e.g. with `DmTurn` and `dmSessionsRoutes`) actually correct?**
  _`DmSession` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _487 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Routes & Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.05136168179646441 - nodes in this community are weakly interconnected._
- **Should `Characters Module` be split into smaller, more focused modules?**
  _Cohesion score 0.05189873417721519 - nodes in this community are weakly interconnected._
- **Should `D&D Rules Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.07287093942054433 - nodes in this community are weakly interconnected._
- **Should `Content Infrastructure` be split into smaller, more focused modules?**
  _Cohesion score 0.07033315705975675 - nodes in this community are weakly interconnected._