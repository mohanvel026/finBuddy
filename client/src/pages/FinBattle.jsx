import { useState, useEffect, useMemo, useRef } from 'react';
/* import Sidebar removed */
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';
import SectionGuide from '../components/common/SectionGuide';

const FinBattle = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('battles');
  const [battles, setBattles] = useState([]);
  const [season, setSeason] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tickDirection, setTickDirection] = useState({});
  const [quiz, setQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [mySquad, setMySquad] = useState(null);
  const [loading, setLoading] = useState(true);

  // Matchmaking Lobbies state
  const [selectedCollege, setSelectedCollege] = useState(user?.college || 'IIT Bombay');
  const [lobbyStatus, setLobbyStatus] = useState('list'); // 'list' | 'creating' | 'waiting'
  const [lobbyMembers, setLobbyMembers] = useState([]);
  const [matchmakingText, setMatchmakingText] = useState('');
  const [searchingTeam, setSearchingTeam] = useState(false);
  const [currentLobbyName, setCurrentLobbyName] = useState('');
  const [currentLobbyEmoji, setCurrentLobbyEmoji] = useState('⚔️');

  const [activeLobbies, setActiveLobbies] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.emit('lobby:get-all');

    socket.on('lobby:list', (lobbies) => {
      setActiveLobbies(lobbies);
    });

    socket.on('lobby:joined', (lobby) => {
      setCurrentLobbyName(lobby.name);
      setCurrentLobbyEmoji(lobby.emoji);
      setLobbyStatus('waiting');
      const members = lobby.members.map(m => ({
        ...m,
        isMe: m.id === user?._id
      }));
      setLobbyMembers(members);
    });

    socket.on('lobby:member-update', (lobby) => {
      const members = lobby.members.map(m => ({
        ...m,
        isMe: m.id === user?._id
      }));
      setLobbyMembers(members);
      const lastMember = members[members.length - 1];
      if (lastMember && lastMember.id !== user?._id) {
        toast(`${lastMember.name} joined the lobby!`, { icon: '👥' });
      }
    });

    socket.on('lobby:left', () => {
      setLobbyStatus('list');
      setLobbyMembers([]);
    });

    socket.on('lobby:locked', (lobby) => {
      const finalSquad = {
        name: lobby.name,
        emoji: lobby.emoji,
        inviteCode: 'SQUAD' + Math.floor(1000 + Math.random() * 9000),
        squadFinScore: Math.round(lobby.members.reduce((a, b) => a + b.finScore, 0) / lobby.members.length),
        seasonWins: 0,
        maxMembers: 4,
        members: lobby.members.map((m, idx) => ({
          user: { name: m.name, finScore: m.finScore, avatar: null },
          role: idx === 0 ? 'captain' : 'member'
        }))
      };
      setMySquad(finalSquad);
      setLobbyStatus('list');
      setLobbyMembers([]);
      setActiveTab('squads');
      toast.success(`Squad ${finalSquad.name} locked & registered for battle! ⚔️`);
    });

    socket.on('lobby:error', (data) => {
      toast.error(data.message);
    });

    return () => {
      socket.off('lobby:list');
      socket.off('lobby:joined');
      socket.off('lobby:member-update');
      socket.off('lobby:left');
      socket.off('lobby:locked');
      socket.off('lobby:error');
    };
  }, [user]);

  // Battle form
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  const [showJoinBattle, setShowJoinBattle] = useState(false);
  const [battleForm, setBattleForm] = useState({ name: '', duration: '1week', battleType: 'trading' });
  const [joinCode, setJoinCode] = useState('');

  // Squad form
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showJoinSquad, setShowJoinSquad] = useState(false);
  const [squadForm, setSquadForm] = useState({ name: '', emoji: '⚔️' });
  const [squadJoinCode, setSquadJoinCode] = useState('');

  // Certificate states
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certTheme, setCertTheme] = useState('purple'); // 'purple' | 'gold' | 'crimson' | 'emerald'
  const [certSignature, setCertSignature] = useState('AI Guru'); // 'AI Guru' | 'Committee' | 'Both'
  const [customCertName, setCustomCertName] = useState(user?.name || "Campus FinBuddy Scholar");

  useEffect(() => {
    if (user?.name) {
      setCustomCertName(user.name);
    }
  }, [user]);

  const certSerial = useMemo(() => {
    const hash = user?._id ? user._id.slice(-6).toUpperCase() : (user?.username ? user.username.slice(0, 4).toUpperCase() + "99" : "SCHOLAR");
    return `FB-CERT-${hash}-${new Date().getFullYear()}`;
  }, [user]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (user?.college) {
      setSelectedCollege(user.college);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'quiz' && quiz.length === 0) loadQuiz();
    if (activeTab === 'season') loadSeason();
    if (activeTab === 'squads' && !mySquad) loadSquad();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'season' || leaderboard.length === 0) return;

    const interval = setInterval(() => {
      const competitors = leaderboard.filter(e => !e.isMe);
      if (competitors.length === 0) return;

      const randomIdx = Math.floor(Math.random() * competitors.length);
      const target = competitors[randomIdx];
      const change = Math.random() > 0.4 ? Math.floor(Math.random() * 15) + 5 : -Math.floor(Math.random() * 5) - 2;

      setTickDirection(prev => ({
        ...prev,
        [target.name]: change >= 0 ? 'up' : 'down'
      }));

      setLeaderboard(prev => {
        const nextList = prev.map(entry => {
          if (entry.name === target.name) {
            const nextPoints = Math.max(0, entry.points + change);
            return { ...entry, points: nextPoints };
          }
          return entry;
        });

        return nextList
          .sort((a, b) => b.points - a.points)
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
      });

      setTimeout(() => {
        setTickDirection(prev => {
          const next = { ...prev };
          delete next[target.name];
          return next;
        });
      }, 1500);

    }, 4500);

    return () => clearInterval(interval);
  }, [activeTab, leaderboard]);

  const trophiesList = useMemo(() => [
    {
      name: 'Compounding Guru',
      desc: 'Reach a FinScore of 600+ to master long-term wealth assets.',
      icon: '👑',
      req: (user?.finScore >= 600),
      badgeColor: 'from-amber-400 to-yellow-600',
      border: 'border-amber-500/30'
    },
    {
      name: 'Trading Lord',
      desc: 'Acquire 200+ FinCoins inside quizzes and tournaments.',
      icon: '🚀',
      req: (user?.virtualCoins >= 200),
      badgeColor: 'from-purple-400 to-indigo-600',
      border: 'border-purple-500/30'
    },
    {
      name: 'Streak Master',
      desc: 'Maintain a 3+ day streak of consecutive logins.',
      icon: '🔥',
      req: (user?.currentStreak >= 3),
      badgeColor: 'from-orange-400 to-red-600',
      border: 'border-orange-500/30'
    },
    {
      name: 'Squad Captain',
      desc: 'Build or match with an active battle squad.',
      icon: '👥',
      req: (mySquad !== null),
      badgeColor: 'from-cyan-400 to-blue-600',
      border: 'border-cyan-500/30'
    },
    {
      name: 'Quiz Champion',
      desc: 'Complete today\'s daily quiz with a perfect score.',
      icon: '📚',
      req: (quizSubmitted && quizResults?.isPerfect),
      badgeColor: 'from-emerald-400 to-green-600',
      border: 'border-emerald-500/30'
    },
    {
      name: 'Legend of D-Street',
      desc: 'Achieve a top tier FinScore of 800+.',
      icon: '🏆',
      req: (user?.finScore >= 800),
      badgeColor: 'from-rose-400 to-pink-600',
      border: 'border-rose-500/30'
    }
  ], [user?.finScore, user?.virtualCoins, user?.currentStreak, mySquad, quizSubmitted, quizResults]);

  const unlockedCount = useMemo(() => trophiesList.filter(t => t.req).length, [trophiesList]);

  const loadData = async () => {
    try {
      const { data } = await api.get('/battles');
      setBattles(data.battles || []);
    } catch (e) { }
    setLoading(false);
  };

  const loadSeason = async () => {
    try {
      const { data } = await api.get('/battles/season/current');
      setSeason(data);
      const list = (data.leaderboard || []).map(entry => ({
        ...entry,
        isMe: entry.name === user?.name
      }));
      setLeaderboard(list);
    } catch (e) { }
  };

  const loadQuiz = async () => {
    try {
      const { data } = await api.get('/battles/quiz/today');
      setQuiz(data.questions || []);
    } catch (e) { }
  };

  const loadSquad = async () => {
    try {
      const { data } = await api.get('/battles/squads/mine');
      setMySquad(data.squad);
    } catch (e) { }
  };

  const createBattle = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/battles', battleForm);
      toast.success('Battle created! 🏆');
      setShowCreateBattle(false);
      setBattleForm({ name: '', duration: '1week', battleType: 'trading' });
      loadData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const joinBattle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/battles/join', { inviteCode: joinCode });
      toast.success('Joined battle! ⚔️');
      setShowJoinBattle(false);
      setJoinCode('');
      loadData();
    } catch (e) { toast.error(e.response?.data?.message || 'Invalid code'); }
  };

  const submitQuiz = async () => {
    if (Object.keys(quizAnswers).length < quiz.length) {
      toast.error('Answer all questions first!');
      return;
    }
    try {
      const answers = Object.entries(quizAnswers).map(([questionId, selectedOption]) => ({
        questionId: parseInt(questionId),
        selectedOption
      }));
      const { data } = await api.post('/battles/quiz/submit', { answers });
      setQuizResults(data);
      setQuizSubmitted(true);
      if (data.coinsEarned > 0) toast.success(`+${data.coinsEarned} coins earned! 🪙`);
      if (data.isPerfect) toast.success('Perfect score! 🏆');
    } catch (e) { toast.error('Submit failed'); }
  };

  const createSquad = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/battles/squads', squadForm);
      setMySquad(data.squad);
      toast.success('Squad created! ⚔️');
      setShowCreateSquad(false);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const joinSquad = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/battles/squads/join', { inviteCode: squadJoinCode });
      setMySquad(data.squad);
      toast.success('Joined squad! ⚔️');
      setShowJoinSquad(false);
    } catch (e) { toast.error(e.response?.data?.message || 'Invalid code'); }
  };

  const statusColor = (status) => ({
    active: 'text-green-400 bg-green-400/10',
    upcoming: 'text-yellow-400 bg-yellow-400/10',
    completed: 'text-slate-400 bg-slate-400/10'
  })[status] || 'text-slate-400';

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">🏆 FinBattle</h1>
          <p className="text-slate-400 text-sm mt-1">Compete with friends • Earn badges • Top the leaderboard</p>
        </div>


        {/* FinScore banner */}
        <div className="card border-cyan-500/20 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-cyan-400">{user?.finScore || 500}</div>
            <div>
              <p className="font-bold">Your FinScore</p>
              <p className="text-sm text-slate-400">
                {user?.finScore >= 700 ? '🔥 Expert Investor' :
                  user?.finScore >= 600 ? '⭐ Advanced' :
                    user?.finScore >= 500 ? '📈 Intermediate' : '🌱 Beginner'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-center">
            <div>
              <p className="text-xl font-bold text-yellow-400">🪙 {user?.virtualCoins || 0}</p>
              <p className="text-xs text-slate-400">Coins</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-400">🔥 {user?.currentStreak || 0}</p>
              <p className="text-xs text-slate-400">Day streak</p>
            </div>
            <div>
              <p className="text-xl font-bold">{user?.badges?.length || 0}</p>
              <p className="text-xs text-slate-400">Badges</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 text-xs lg:text-sm">
          {[
            { id: 'battles', label: '⚔️ Battles' },
            { id: 'lobbies', label: '🌐 Lobbies' },
            { id: 'quiz', label: '📚 Daily Quiz' },
            { id: 'season', label: '🏆 Season' },
            { id: 'squads', label: '👥 Squads' },
            { id: 'trophies', label: '💎 Trophies' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 capitalize font-medium text-sm whitespace-nowrap border-b-2 transition ${activeTab === t.id ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'
                }`}
            >{t.label}</button>
          ))}
        </div>

        {/* Battles Tab */}
        {activeTab === 'battles' && (
          <div className="space-y-6">
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowJoinBattle(true)} className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>Join Battle</button>
              <button onClick={() => setShowCreateBattle(true)} className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }}>⚔️ Create Battle</button>
            </div>

            {battles.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-5xl mb-4">⚔️</div>
                <h3 className="text-xl font-bold mb-2">No battles yet</h3>
                <p className="text-slate-400 mb-6">Create a battle and invite your friends to compete!</p>
                <button onClick={() => setShowCreateBattle(true)} className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>Create First Battle</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {battles.map(battle => {
                  const myParticipant = battle.participants?.find(p => p.user?._id === user?._id || p.user === user?._id);
                  const myRank = myParticipant?.rank;
                  const daysLeft = Math.max(0, Math.ceil((new Date(battle.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div key={battle._id} className="card hover:border-white/10 transition">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{battle.name}</h3>
                          <p className="text-xs text-slate-400 capitalize">{battle.duration} • {battle.battleType} battle</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColor(battle.status)}`}>
                          {battle.status}
                        </span>
                      </div>

                      {/* Participants */}
                      <div className="flex items-center gap-1 mb-4">
                        {battle.participants?.slice(0, 5).map((p, i) => (
                          <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 border-2 border-[var(--bg-secondary)] flex items-center justify-center text-xs font-bold overflow-hidden"
                            style={{ marginLeft: i > 0 ? '-6px' : 0 }}
                          >
                            {p.user?.avatar ? <img src={p.user.avatar} alt="" className="w-full h-full object-cover" /> : p.user?.name?.[0]}
                          </div>
                        ))}
                        <span className="text-xs text-slate-400 ml-2">{battle.participants?.length} fighters</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center p-2 bg-white/5 rounded-lg">
                          <p className="text-xs text-slate-400">My Rank</p>
                          <p className="font-bold text-cyan-400">#{myRank || '?'}</p>
                        </div>
                        <div className="text-center p-2 bg-white/5 rounded-lg">
                          <p className="text-xs text-slate-400">Days Left</p>
                          <p className="font-bold">{daysLeft}d</p>
                        </div>
                        <div className="text-center p-2 bg-white/5 rounded-lg">
                          <p className="text-xs text-slate-400">Code</p>
                          <p className="font-bold text-yellow-400 text-xs tracking-wider">{battle.inviteCode}</p>
                        </div>
                      </div>

                      {battle.winner && (
                        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center text-sm">
                          🏆 Winner: <strong>{battle.winner.name}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Lobbies Tab */}
        {activeTab === 'lobbies' && (() => {
          const filteredLobbies = activeLobbies.filter(l => l.college === selectedCollege);

          return (
            <div className="max-w-2xl space-y-6">
              {/* Lobbies header */}
              <div className="card border-cyan-500/20 relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white">🌐 Campus Matchmaking</h3>
                    <p className="text-sm text-slate-400">Match with peers from your college and squad up for Season Battles</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-bold">
                      {selectedCollege}
                    </span>
                  </div>
                </div>

                {/* College affiliation selector */}
                <div className="mt-4 flex gap-2 items-center">
                  <span className="text-xs text-slate-400 shrink-0 font-medium">Affiliation:</span>
                  <select 
                    className="input-dark text-xs py-1.5 px-3 rounded-lg"
                    value={selectedCollege} 
                    onChange={e => {
                      setSelectedCollege(e.target.value);
                      toast.success(`Switched affiliation to ${e.target.value}!`);
                    }}
                    style={{ width: 'auto' }}
                  >
                    <option value="IIT Bombay">IIT Bombay</option>
                    <option value="BITS Pilani">BITS Pilani</option>
                    <option value="NIT Trichy">NIT Trichy</option>
                    <option value="Delhi University">Delhi University</option>
                    <option value="VIT Vellore">VIT Vellore</option>
                  </select>
                </div>
              </div>

              {searchingTeam ? (
                <div className="card text-center py-16 space-y-4">
                  <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <h3 className="text-lg font-bold text-cyan-400 animate-pulse">Lobby Matchmaking in Progress</h3>
                  <p className="text-slate-400 text-sm">{matchmakingText}</p>
                  <button 
                    onClick={() => setSearchingTeam(false)} 
                    className="btn-secondary text-xs" 
                    style={{ width: 'auto', padding: '6px 12px' }}
                  >
                    Cancel Matchmaking
                  </button>
                </div>
              ) : lobbyStatus === 'waiting' ? (
                <div className="card border-purple-500/20 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <span className="text-2xl">{currentLobbyEmoji}</span>
                        <span>Lobby: {currentLobbyName || 'My Squad Lobby'}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Waiting for campus squadmates to join...</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Lobby Code</span>
                      <span className="font-mono font-bold text-purple-400 text-sm tracking-wider">LOBBY-{String(currentLobbyName.length * 37 + 100).toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Member slots */}
                  <div className="space-y-3 mb-6">
                    {Array.from({ length: 4 }).map((_, idx) => {
                      const member = lobbyMembers[idx];
                      return member ? (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 animate-fade-in">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center font-bold text-white text-xs">
                            {member.name[0]}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-white flex items-center gap-2">
                              <span>{member.name}</span>
                              {member.isMe && (
                                <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-md font-extrabold uppercase">You</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">{selectedCollege}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-cyan-400 font-bold">FinScore {member.finScore}</span>
                          </div>
                        </div>
                      ) : (
                        <div key={idx} className="flex items-center gap-3 p-3 border border-dashed border-white/5 bg-white/[0.01] rounded-xl text-slate-500">
                          <div className="w-8 h-8 rounded-full border border-dashed border-slate-500/30 flex items-center justify-center text-xs text-slate-400">
                            ?
                          </div>
                          <span className="text-xs italic">Waiting for squadmate to connect...</span>
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-500/30 animate-pulse ml-auto" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (socketRef.current) {
                          socketRef.current.emit('lobby:leave');
                        }
                      }} 
                      className="btn-secondary flex-1"
                    >
                      Leave Lobby
                    </button>
                    <button 
                      onClick={() => {
                        if (lobbyMembers.length < 2) {
                          toast.error('Need at least 2 members to lock squad!');
                          return;
                        }
                        if (socketRef.current) {
                          socketRef.current.emit('lobby:lock');
                        }
                      }} 
                      className="btn-primary flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                      disabled={lobbyMembers.length < 2}
                    >
                      {lobbyMembers.length < 2 ? `Assembling (${lobbyMembers.length}/4)...` : 'Lock Squad & Battle! ⚔️'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Search buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        const compatibleLobby = activeLobbies.find(
                          l => l.college === selectedCollege && l.members.length < 4
                        );

                        setSearchingTeam(true);
                        setMatchmakingText('Contacting regional college servers...');
                        setTimeout(() => {
                          setMatchmakingText('Filtering active students from ' + selectedCollege + '...');
                          setTimeout(() => {
                            setMatchmakingText('Matching by FinScore compatibility...');
                            setTimeout(() => {
                              setSearchingTeam(false);
                              if (compatibleLobby) {
                                if (socketRef.current) {
                                  socketRef.current.emit('lobby:join', { lobbyId: compatibleLobby.id });
                                }
                              } else {
                                const autoName = `${user?.name || 'Campus'}'s Squad`;
                                const autoEmoji = ['⚔️', '🦁', '🔥', '💎', '🚀', '⚡', '🏆', '🦅'][Math.floor(Math.random() * 8)];
                                if (socketRef.current) {
                                  socketRef.current.emit('lobby:create', { 
                                    name: autoName, 
                                    emoji: autoEmoji, 
                                    college: selectedCollege 
                                  });
                                  toast.success(`No open squads found. Created new lobby: ${autoName}!`);
                                }
                              }
                            }, 800);
                          }, 800);
                        }, 800);
                      }} 
                      className="p-5 rounded-2xl border border-cyan-500/10 hover:border-cyan-500/30 bg-cyan-950/5 text-center transition group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">⚡</span>
                      <h4 className="font-bold text-sm text-white">Quick Match</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Instantly find and join a campus squad lobby</p>
                    </button>

                    <button 
                      onClick={() => {
                        const nameInput = prompt('Enter a name for your squad:', `${user?.name || 'IIT'}'s Bulls`);
                        if (!nameInput) return;
                        const randomEmoji = ['⚔️', '🦁', '🔥', '💎', '🚀', '⚡', '🏆', '🦅'][Math.floor(Math.random() * 8)];
                        if (socketRef.current) {
                          socketRef.current.emit('lobby:create', {
                            name: nameInput,
                            emoji: randomEmoji,
                            college: selectedCollege
                          });
                        }
                      }} 
                      className="p-5 rounded-2xl border border-purple-500/10 hover:border-purple-500/30 bg-purple-950/5 text-center transition group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">➕</span>
                      <h4 className="font-bold text-sm text-white">Create Squad Lobby</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Host your own lobby and invite peers to join</p>
                    </button>
                  </div>

                  {/* Available Lobbies List */}
                  <div className="card">
                    <h3 className="font-bold mb-4 flex items-center gap-1.5">
                      <span>📡 Lobbies seeking squadmates</span>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full font-bold ml-auto animate-pulse">
                        {filteredLobbies.length} open
                      </span>
                    </h3>
                    {filteredLobbies.length > 0 ? (
                      <div className="space-y-3">
                        {filteredLobbies.map(lobby => (
                          <div key={lobby.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5">
                            <span className="text-2xl">{lobby.emoji}</span>
                            <div className="flex-1">
                              <h4 className="font-bold text-sm text-white">{lobby.name}</h4>
                              <p className="text-[10px] text-slate-400">{lobby.college} • {lobby.members.length}/4 members</p>
                            </div>
                            <button 
                              onClick={() => {
                                setSearchingTeam(true);
                                setMatchmakingText(`Joining lobby ${lobby.name}...`);
                                setTimeout(() => {
                                  setSearchingTeam(false);
                                  if (socketRef.current) {
                                    socketRef.current.emit('lobby:join', { lobbyId: lobby.id });
                                  }
                                }, 800);
                              }}
                              className="py-1.5 px-3 rounded-lg text-xs bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition"
                            >
                              Join Lobby
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs italic">
                        No other lobbies active in {selectedCollege} right now. Click "Create Squad Lobby" to start one!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="max-w-2xl space-y-6">
            <div className="card border-yellow-500/20 flex items-center justify-between">
              <div>
                <h3 className="font-bold">Daily Financial Quiz</h3>
                <p className="text-sm text-slate-400">Answer 3 questions, earn coins!</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-400">🪙 {quiz.reduce((s, q) => s + (q.coins || 10), 0)}</p>
                <p className="text-xs text-slate-400">Max coins today</p>
              </div>
            </div>

            {quizSubmitted && quizResults ? (
              <div className="space-y-6">
                <div className="card border-cyan-500/20 text-center py-8">
                  <div className="text-6xl mb-4">
                    {quizResults.isPerfect ? '🏆' : quizResults.correct >= quizResults.total / 2 ? '⭐' : '📚'}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {quizResults.correct}/{quizResults.total} Correct!
                  </h3>
                  <p className="text-yellow-400 text-xl font-bold mb-4">+{quizResults.coinsEarned} coins earned 🪙</p>
                  {quizResults.isPerfect && <p className="text-green-400">Perfect score! Amazing! 🎉</p>}
                  <button onClick={() => { setQuiz([]); setQuizAnswers({}); setQuizSubmitted(false); setQuizResults(null); loadQuiz(); }}
                    className="btn-secondary mt-6" style={{ width: 'auto', padding: '10px 20px' }}>Try Tomorrow's Quiz</button>
                </div>

                <h3 className="font-bold text-lg mt-8 mb-4">📚 Detailed Review & Explanations</h3>
                {quiz.map((q, qi) => {
                  const result = quizResults.results?.find(r => r.questionId === q.id) || {};
                  const userAns = quizAnswers[q.id];
                  const correctAns = result.correctAnswer;

                  return (
                    <div key={q.id} className={`card border ${result.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-full capitalize">{q.category}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${result.isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                        <span className="ml-auto text-yellow-400 text-sm">🪙 +{q.coins}</span>
                      </div>
                      <p className="font-medium mb-4">Q{qi + 1}. {q.question}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt, oi) => {
                          const isUserSelected = userAns === oi;
                          const isCorrectOption = correctAns === oi;
                          let btnStyle = 'border-white/10 bg-white/5 text-slate-300';
                          
                          if (isCorrectOption) {
                            btnStyle = 'border-green-500 bg-green-500/20 text-green-400 font-bold';
                          } else if (isUserSelected && !isCorrectOption) {
                            btnStyle = 'border-red-500 bg-red-500/20 text-red-400 font-bold';
                          }

                          return (
                            <div key={oi} className={`p-3 rounded-xl text-sm border text-left ${btnStyle}`}>
                              <span className="font-bold mr-2">{['A', 'B', 'C', 'D'][oi]}.</span>{opt}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl mt-3 text-xs leading-relaxed text-slate-300">
                        <span className="font-bold text-cyan-400 block mb-1">💡 AI Explanation</span>
                        {result.explanation || 'No explanation available.'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {quiz.map((q, qi) => (
                  <div key={q.id} className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-full capitalize">{q.category}</span>
                      <span className="text-xs px-2 py-1 bg-white/5 text-slate-400 rounded-full capitalize">{q.difficulty}</span>
                      <span className="ml-auto text-yellow-400 text-sm">🪙 +{q.coins}</span>
                    </div>
                    <p className="font-medium mb-4">Q{qi + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, oi) => (
                        <button key={oi}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oi }))}
                          className={`p-3 rounded-xl text-sm text-left transition border ${quizAnswers[q.id] === oi
                              ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                            }`}
                        >
                          <span className="font-bold mr-2">{['A', 'B', 'C', 'D'][oi]}.</span>{opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {quiz.length > 0 && (
                  <button onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length < quiz.length}
                    className="btn-primary"
                  >
                    Submit Quiz ({Object.keys(quizAnswers).length}/{quiz.length} answered)
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Season Tab */}
        {activeTab === 'season' && season && (
          <div className="max-w-2xl space-y-6">
            <div className="card border-purple-500/20 text-center py-6">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider text-xs">Current Season</p>
              <h2 className="text-2xl font-bold gradient-text">{season.season?.name}</h2>
              <p className="text-slate-400 mt-2 text-xs">{season.season?.daysLeft} days remaining</p>
            </div>

            <div className="card">
              <h3 className="font-bold mb-4 flex items-center gap-1.5">
                <span>🏆 Season Leaderboard</span>
                <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" /> Live Activity Ticking
                </span>
              </h3>
              <div className="space-y-3">
                {leaderboard.map((entry, i) => {
                  const tickDir = tickDirection[entry.name];
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                      entry.isMe 
                        ? 'bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                        : tickDir === 'up'
                          ? 'bg-green-500/10 border border-green-500/20 scale-[1.01]'
                          : tickDir === 'down'
                            ? 'bg-red-500/10 border border-red-500/20 scale-[0.99]'
                            : 'hover:bg-white/5 border border-transparent'
                    }`}>
                      <span className={`text-lg font-bold w-8 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-sm font-bold overflow-hidden">
                        {entry.avatar ? <img src={entry.avatar} alt="" className="w-full h-full object-cover" /> : entry.name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-white">{entry.name}</p>
                        <p className="text-xs text-slate-400">{entry.college || 'FinBuddy User'}</p>
                      </div>
                      <div className="text-right flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className={`font-mono font-bold transition-colors duration-300 ${
                            tickDir === 'up' ? 'text-green-400' : tickDir === 'down' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {entry.points} pts
                          </p>
                          <p className="text-xs text-slate-400">FinScore {entry.finScore}</p>
                        </div>
                        {tickDir && (
                          <span className={`text-xs font-bold ${tickDir === 'up' ? 'text-green-400 animate-bounce' : 'text-red-400 animate-pulse'}`}>
                            {tickDir === 'up' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(leaderboard.length === 0) && (
                  <p className="text-center text-slate-500 py-4">No public profiles yet. Enable yours in settings!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Squads Tab */}
        {activeTab === 'squads' && (
          <div className="max-w-2xl space-y-6">
            {mySquad ? (
              <>
                <div className="card border-cyan-500/20">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{mySquad.emoji}</span>
                    <div>
                      <h2 className="text-xl font-bold">{mySquad.name}</h2>
                      <p className="text-slate-400 text-sm">{mySquad.members?.length} / {mySquad.maxMembers} members</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-slate-400 text-xs">Squad Code</p>
                      <p className="font-bold text-cyan-400 tracking-wider">{mySquad.inviteCode}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="card bg-[var(--bg-primary)] text-center">
                      <p className="text-xs text-slate-400">Squad FinScore</p>
                      <p className="text-xl font-bold text-cyan-400">{mySquad.squadFinScore || 500}</p>
                    </div>
                    <div className="card bg-[var(--bg-primary)] text-center">
                      <p className="text-xs text-slate-400">Season Wins</p>
                      <p className="text-xl font-bold text-yellow-400">{mySquad.seasonWins || 0}</p>
                    </div>
                  </div>

                  <h3 className="font-bold mb-3">Members</h3>
                  <div className="space-y-2">
                    {mySquad.members?.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center font-bold overflow-hidden">
                          {m.user?.avatar ? <img src={m.user.avatar} alt="" className="w-full h-full object-cover" /> : m.user?.name?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{m.user?.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{m.role}</p>
                        </div>
                        <p className="text-sm text-cyan-400 font-bold">{m.user?.finScore || 500}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="card text-center py-12">
                <div className="text-5xl mb-4">⚔️</div>
                <h3 className="text-xl font-bold mb-2">No squad yet</h3>
                <p className="text-slate-400 mb-6">Create or join a squad of up to 4 friends and battle together!</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setShowJoinSquad(true)} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Join Squad</button>
                  <button onClick={() => setShowCreateSquad(true)} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>Create Squad</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trophies Tab */}
        {activeTab === 'trophies' && (
          <div className="space-y-8 max-w-4xl animate-fade-in">
            {/* 🎓 Financial Competency Certificate Status */}
            <div className="card border-violet-500/20 bg-gradient-to-br from-violet-950/10 to-slate-950/20 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-pink-500/5 pointer-events-none" />
              <div className="flex items-center gap-3.5 relative z-10">
                <span className="text-3xl p-2 bg-violet-500/10 rounded-2xl border border-violet-500/20 text-violet-400 animate-float">🎓</span>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Campus Financial Competency Certification</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Demonstrate your financial capabilities. Unlock at least 3 trophies in the Campus Battle room to claim your official digital Certificate of Financial Excellence!
                  </p>
                  
                  {/* Progress Info */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-40 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-pink-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(unlockedCount / 6) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase font-mono">{unlockedCount} / 6 Achievements</span>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10 shrink-0 w-full md:w-auto text-center md:text-right">
                {unlockedCount >= 3 ? (
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="btn-primary w-auto py-2.5 px-6 rounded-xl font-black text-xs animate-neon-pulse flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <span>📜 Claim & View Certificate</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-slate-950/85 border border-white/5 py-2.5 px-5 rounded-xl text-slate-500 font-bold text-xs select-none mx-auto">
                    <span>🔒 Locked ({3 - unlockedCount} more needed)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trophy Shelf section */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                <span>💎 Campus Battle Trophy Room</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trophiesList.map((trophy, idx) => {
                  const isUnlocked = trophy.req;
                  return (
                    <div 
                      key={idx} 
                      className={`card p-4 text-center border relative overflow-hidden transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                        isUnlocked 
                          ? `${trophy.border} bg-white/[0.02] shadow-[0_8px_32px_rgba(255,255,255,0.02)] animate-neon-pulse` 
                          : 'border-white/5 bg-white/[0.005] opacity-40'
                      }`}
                    >
                      {isUnlocked && (
                        <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rotate-45 translate-x-6 -translate-y-6" />
                      )}
                      
                      {/* Trophy Medal Icon */}
                      <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl shadow-md ${
                        isUnlocked 
                          ? `bg-gradient-to-br ${trophy.badgeColor} text-white animate-float` 
                          : 'bg-white/5 text-slate-500'
                      }`}>
                        {isUnlocked ? trophy.icon : '🔒'}
                      </div>

                      <h4 className="font-bold text-sm text-white">{trophy.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{trophy.desc}</p>
                      
                      <div className="mt-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isUnlocked 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {isUnlocked ? 'Unlocked 🔓' : 'Locked 🔒'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Battle History Log section */}
            <div className="card">
              <h3 className="font-bold text-md mb-4 flex items-center gap-2 text-white">
                <span>⚔️ Historical Campus Matches</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider text-[9px] font-extrabold">
                      <th className="pb-3">Battle Event</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Affiliated Opponents</th>
                      <th className="pb-3">Final Rank</th>
                      <th className="pb-3 text-right">Winnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { name: 'Nifty 50 Trading Clash', date: '2 days ago', type: 'trading', opponent: 'IIT Bombay Squad', rank: '#2/12 teams', winnings: '🪙 250 coins', icon: '📈', isWin: true },
                      { name: 'Weekly Savings Duel', date: '1 week ago', type: 'savings', opponent: 'BITS Pilani Squad', rank: '#1/8 teams', winnings: '🪙 500 coins', icon: '💰', isWin: true },
                      { name: 'Crypto Momentum Blitz', date: '2 weeks ago', type: 'trading', opponent: 'Delhi University Squad', rank: '#4/16 teams', winnings: '🪙 50 coins', icon: '🪙', isWin: false },
                      { name: 'Budget Master Challenge', date: '3 weeks ago', type: 'spending', opponent: 'NIT Trichy Squad', rank: '#1/6 teams', winnings: '🪙 150 coins', icon: '⚖️', isWin: true }
                    ].map((history, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 flex items-center gap-2">
                          <span className="text-base">{history.icon}</span>
                          <div>
                            <span className="font-bold text-white block">{history.name}</span>
                            <span className="text-[10px] text-slate-400">{history.date}</span>
                          </div>
                        </td>
                        <td className="py-3 capitalize text-slate-400">{history.type}</td>
                        <td className="py-3 text-slate-300">{history.opponent}</td>
                        <td className="py-3 font-bold">
                          <span className={`px-2 py-0.5 rounded-md ${
                            history.rank.includes('#1') 
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                              : history.rank.includes('#2')
                                ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20'
                                : 'bg-white/5 text-slate-400'
                          }`}>
                            {history.rank}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-yellow-400">{history.winnings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {/* Certificate Modal */}
        {showCertificateModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-55 p-4 overflow-y-auto backdrop-blur-md animate-fade-in certificate-print-wrap">
            <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative space-y-6 flex flex-col items-center print:border-0 print:bg-white print:text-black print:p-0 print:shadow-none print:my-0">
              
              {/* Close Button & Theme Controllers */}
              <div className="flex flex-wrap items-center justify-between w-full border-b border-white/5 pb-4 print:hidden gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Accredited Certificate Panel</span>
                </div>
                
                {/* Theme Selector */}
                <div className="flex items-center bg-black/40 p-1 border border-white/5 rounded-xl gap-1.5 text-[10px] font-bold">
                  <span className="text-slate-400 px-1.5">Theme:</span>
                  {[
                    { id: 'purple', label: '💜 Purple' },
                    { id: 'gold', label: '💛 Gold' },
                    { id: 'crimson', label: '❤️ Crimson' },
                    { id: 'emerald', label: '💚 Emerald' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCertTheme(t.id)}
                      className={`px-2 py-0.5 rounded cursor-pointer transition ${certTheme === t.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-355'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Signature Selector */}
                <div className="flex items-center bg-black/40 p-1 border border-white/5 rounded-xl gap-1.5 text-[10px] font-bold">
                  <span className="text-slate-400 px-1.5">Sign:</span>
                  {['AI Guru', 'Committee', 'Both'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCertSignature(s)}
                      className={`px-2 py-0.5 rounded cursor-pointer transition ${certSignature === s ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-355'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Edit Name Customization */}
                <div className="flex items-center bg-black/40 p-1 border border-white/5 rounded-xl gap-1.5 text-[10px] font-bold">
                  <span className="text-slate-400 px-1.5">Edit Name:</span>
                  <input
                    type="text"
                    value={customCertName}
                    onChange={(e) => setCustomCertName(e.target.value)}
                    placeholder="Cert Name"
                    className="bg-transparent border-0 outline-none text-white w-28 px-1 rounded text-[10px] font-bold border-b border-white/15 focus:border-white/40 transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              {/* Certificate Inner Canvas - Designed horizontally */}
              <div 
                className={`w-full border-8 p-8 md:p-12 text-center relative overflow-hidden flex flex-col justify-between items-center rounded-2xl min-h-[460px] transition-all print:border-double print:border-4 print:p-8 print:m-0 print:rounded-none ${
                  certTheme === 'gold' 
                    ? 'bg-gradient-to-br from-yellow-950/20 via-slate-900/95 to-amber-950/30 border-yellow-500/40 text-slate-100 shadow-[0_0_35px_rgba(234,179,8,0.08)] print:border-yellow-600 print:text-black print:bg-white'
                    : certTheme === 'crimson'
                      ? 'bg-gradient-to-br from-red-950/20 via-slate-900/95 to-rose-950/30 border-red-500/40 text-slate-100 shadow-[0_0_35px_rgba(239,68,68,0.08)] print:border-red-600 print:text-black print:bg-white'
                      : certTheme === 'emerald'
                        ? 'bg-gradient-to-br from-emerald-950/20 via-slate-900/95 to-teal-950/30 border-emerald-500/40 text-slate-100 shadow-[0_0_35px_rgba(16,185,129,0.08)] print:border-emerald-600 print:text-black print:bg-white'
                        : 'bg-gradient-to-br from-violet-950/20 via-slate-900/95 to-indigo-950/30 border-violet-500/40 text-slate-100 shadow-[0_0_35px_rgba(124,58,237,0.08)] print:border-violet-600 print:text-black print:bg-white'
                }`}
                style={{ borderWidth: '10px', borderStyle: 'double' }}
              >
                {/* Visual watermarked background stamp */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] opacity-[0.015] select-none pointer-events-none font-sans font-black print:opacity-[0.03]">
                  FINBUDDY
                </div>

                {/* Corner Ornaments */}
                <div className="absolute top-3 left-3 text-sm opacity-50 select-none print:text-black">⚜️</div>
                <div className="absolute top-3 right-3 text-sm opacity-50 select-none print:text-black">⚜️</div>
                <div className="absolute bottom-3 left-3 text-sm opacity-50 select-none print:text-black">⚜️</div>
                <div className="absolute bottom-3 right-3 text-sm opacity-50 select-none print:text-black">⚜️</div>

                {/* Certificate Content Header */}
                <div className="space-y-2">
                  <span className={`text-[10px] font-black tracking-widest uppercase font-mono px-3 py-1 bg-white/5 rounded-full border print:border-black/15 print:text-black ${
                    certTheme === 'gold' ? 'text-yellow-400 border-yellow-500/25' :
                    certTheme === 'crimson' ? 'text-red-400 border-red-500/25' :
                    certTheme === 'emerald' ? 'text-emerald-400 border-emerald-500/25' :
                    'text-violet-400 border-violet-500/25'
                  }`}>
                    Official Accreditation Board
                  </span>
                  <h1 className="text-xl md:text-3xl font-serif font-black tracking-tight text-white mt-3 print:text-black">
                    Certificate of Financial Competency
                  </h1>
                </div>

                {/* Recipient Details */}
                <div className="my-5 max-w-xl space-y-2">
                  <p className="text-[11px] italic text-slate-400 font-serif print:text-slate-600">
                    This is proudly presented to
                  </p>
                  <h2 className={`text-2xl md:text-3xl font-bold border-b border-dashed pb-2 inline-block px-10 print:text-black print:border-slate-300 ${
                    certTheme === 'gold' ? 'text-yellow-400 border-yellow-500/30' :
                    certTheme === 'crimson' ? 'text-red-400 border-red-500/30' :
                    certTheme === 'emerald' ? 'text-emerald-400 border-emerald-500/30' :
                    'text-violet-400 border-violet-500/30'
                  }`}>
                    {user?.name || "Campus FinBuddy Scholar"}
                  </h2>
                  <p className="text-[10px] md:text-xs text-slate-350 leading-relaxed font-sans max-w-lg mx-auto print:text-slate-700">
                    for demonstrating outstanding knowledge and competency in personal finance, compound growth strategies, stock portfolio modeling, and risk auditing on the FinBuddy Arena.
                  </p>
                </div>

                {/* Achievement Seals list */}
                <div className="flex flex-wrap items-center justify-center gap-3 my-4">
                  {trophiesList.filter(t => t.req).map((trophy, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-slate-300 print:border-black/10 print:bg-slate-100 print:text-black"
                    >
                      <span>{trophy.icon}</span>
                      <span>{trophy.name}</span>
                    </div>
                  ))}
                </div>

                {/* Footer Signatures block */}
                <div className="w-full flex justify-between items-end border-t border-white/5 pt-6 mt-4 max-w-2xl px-4 text-left print:border-slate-200">
                  {/* Left Signature */}
                  {(certSignature === 'AI Guru' || certSignature === 'Both') && (
                    <div>
                      <p className="font-serif italic text-sm text-cyan-400 font-bold select-none print:text-black" style={{ fontFamily: "Georgia, serif" }}>
                        ✍️ AI Guru Advisor
                      </p>
                      <div className="w-24 h-px bg-white/10 mt-1 print:bg-slate-300" />
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider mt-1">Accredited Signature</p>
                    </div>
                  )}

                  {/* Center Stamp */}
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl select-none mx-auto ${
                      certTheme === 'gold' ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400' :
                      certTheme === 'crimson' ? 'border-red-500/30 bg-red-500/5 text-red-400' :
                      certTheme === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' :
                      'border-violet-500/30 bg-violet-500/5 text-violet-400'
                    }`}>
                      🎖️
                    </div>
                    <p className="text-[7px] text-slate-500 font-mono tracking-widest mt-1 uppercase">SECURE VERIFIED</p>
                  </div>

                  {/* Right Signature */}
                  {(certSignature === 'Committee' || certSignature === 'Both') && (
                    <div className="text-right">
                      <p className="font-serif italic text-sm text-pink-400 font-bold select-none print:text-black" style={{ fontFamily: "Georgia, serif" }}>
                        ✍️ FinBuddy Board
                      </p>
                      <div className="w-24 h-px bg-white/10 mt-1 print:bg-slate-300" />
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider mt-1">Campus Committee</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="w-full flex justify-between items-center gap-3 pt-3 border-t border-white/5 print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    const text = `🎉 I just earned my Certificate of Financial Competency on FinBuddy with a FinScore of ${user?.finScore || 500}! check it out: http://localhost:5177/learn`;
                    navigator.clipboard.writeText(text);
                    toast.success("📋 LinkedIn post layout copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>🔗 Copy LinkedIn Post</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-primary w-auto py-2 px-5 rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🖨️ Print / Save PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(false)}
                    className="btn-secondary w-auto py-2 px-5 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreateBattle && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">⚔️ Create Battle</h2>
                <button onClick={() => setShowCreateBattle(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>
              <form onSubmit={createBattle} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Battle Name</label>
                  <input className="input-dark" placeholder="Week 1 Challenge, June Showdown..." value={battleForm.name} onChange={e => setBattleForm({ ...battleForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1day', '1week', '1month'].map(d => (
                      <button key={d} type="button" onClick={() => setBattleForm({ ...battleForm, duration: d })}
                        className={`py-2 rounded-xl text-sm transition ${battleForm.duration === d ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' : 'bg-white/5 text-slate-400'}`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Battle Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['trading', 'savings', 'spending'].map(t => (
                      <button key={t} type="button" onClick={() => setBattleForm({ ...battleForm, battleType: t })}
                        className={`py-2 rounded-xl text-sm capitalize transition ${battleForm.battleType === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' : 'bg-white/5 text-slate-400'}`}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateBattle(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Create ⚔️</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showJoinBattle && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-sm animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Join Battle</h2>
                <button onClick={() => setShowJoinBattle(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>
              <form onSubmit={joinBattle} className="space-y-4">
                <input className="input-dark text-center text-2xl font-bold tracking-widest uppercase" placeholder="ABCD" maxLength={8} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} required />
                <button type="submit" className="btn-primary">Join Battle ⚔️</button>
              </form>
            </div>
          </div>
        )}

        {showCreateSquad && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-sm animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create Squad</h2>
                <button onClick={() => setShowCreateSquad(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>
              <form onSubmit={createSquad} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Squad Name</label>
                  <input className="input-dark" placeholder="Finance Warriors..." value={squadForm.name} onChange={e => setSquadForm({ ...squadForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Emoji</label>
                  <div className="flex gap-2 flex-wrap">
                    {['⚔️', '🦁', '🔥', '💎', '🚀', '⚡', '🏆', '🦅'].map(e => (
                      <button key={e} type="button" onClick={() => setSquadForm({ ...squadForm, emoji: e })}
                        className={`text-2xl p-2 rounded-xl transition ${squadForm.emoji === e ? 'bg-cyan-500/20 border border-cyan-500' : 'bg-white/5 hover:bg-white/10'}`}
                      >{e}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreateSquad(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Create {squadForm.emoji}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showJoinSquad && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-sm animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Join Squad</h2>
                <button onClick={() => setShowJoinSquad(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>
              <form onSubmit={joinSquad} className="space-y-4">
                <input className="input-dark text-center text-2xl font-bold tracking-widest uppercase" placeholder="ABCD" maxLength={8} value={squadJoinCode} onChange={e => setSquadJoinCode(e.target.value.toUpperCase())} required />
                <button type="submit" className="btn-primary">Join Squad ⚔️</button>
              </form>
            </div>
          </div>
        )}
        <SectionGuide sectionId="/battle" />
      </main>
    
    </div>
  );
};

export default FinBattle;