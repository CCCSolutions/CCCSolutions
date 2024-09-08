// eslint-disable-next-line no-unused-vars
import React from "react";
import ProblemsTable from "../components/ProblemTable.jsx";
import SearchBar from "../components/Searchbar.jsx";

const problems = [
	// 2024 Junior
	{ name: '2024 J1 - Conveyor Belt Sushi', difficulty: 'Easy', tags: ['simple math'], link: '/contest/2024/j1' },
	{ name: '2024 J2 - Dusa And The Yobis', difficulty: 'Easy', tags: ['implementation', 'simple math'], link: '/contest/2024/j2' },
	{ name: '2024 J3 - Bronze Count', difficulty: 'Normal', tags: ['implementation', 'simple math'], link: '/contest/2024/j3' },
	{ name: '2024 J4 - Troublesome Keys', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2024/j4' },
	{ name: '2024 J5 - Harvest Waterloo', difficulty: 'Normal', tags: ['graph theory', 'simple math'], link: '/contest/2024/j5' },

	// 2024 Senior
	{ name: '2024 S1 - Hat Circle', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2024/s1' },
	{ name: '2024 S2 - Heavy-Light Composition', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2024/s2' },
	{ name: '2024 S3 - Swipe', difficulty: 'Hard', tags: ['ad hoc'], link: '/contest/2024/s3' },
	{ name: '2024 S4 - Painting Roads', difficulty: 'Insane', tags: ['graph theory'], link: '/contest/2024/s4' },
	{ name: '2024 S5 - Chocolate Bar Partition', difficulty: 'Wicked', tags: ['dynamic programming'], link: '/contest/2024/s5' },

	// 2023 Junior
	{ name: '2023 J1 - Deliv-e-droid', difficulty: 'Easy', tags: ['simple math'], link: '/contest/2023/j1' },
	{ name: '2023 J2 - Chili Peppers', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2023/j2' },
	{ name: '2023 J3 - Special Event', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2023/j3' },
	{ name: '2023 J4 - Trianglane', difficulty: 'Normal', tags: ['simple math'], link: '/contest/2023/s1' },
	{ name: '2023 J5 - CCC Word Hunt', difficulty: 'Insane', tags: ['implementation'], link: '/contest/2023/j5' },

	// 2023 Senior
	{ name: '2023 S1 - Trianglane', difficulty: 'Normal', tags: ['simple math'], link: '/contest/2023/s1' },
	{ name: '2023 S2 - Symmetric Mountains', difficulty: 'Hard', tags: ['implementation'], link: '/contest/2023/s2' },
	{ name: '2023 S3 - Palindromic Poster', difficulty: 'Hard', tags: ['ad hoc', 'constructive'], link: '/contest/2023/s3' },
	{ name: '2023 S4 - Minimum Cost Roads', difficulty: 'Insane', tags: ['graph theory'], link: '/contest/2023/s4' },
	{ name: '2023 S5 - The Filter', difficulty: 'Wicked', tags: ['graph theory', 'intermediate math'], link: '/contest/2023/s5' },

	// 2022 Junior
	{ name: '2022 J1 - Cupcake Party', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2022/j1' },
	{ name: '2022 J2 - Fergusonball Ratings', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2022/j2' },
	{ name: '2022 J3 - Harp Tuning', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2022/j3' },
	{ name: '2022 J4 - Good Groups', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2022/s2' },
	{ name: '2022 J5 - Square Pool', difficulty: 'Insane', tags: ['brute force', 'implementation'], link: '/contest/2022/j5' },

	// 2022 Senior
	{ name: '2022 S1 - Good Fours and Good Fives', difficulty: 'Normal', tags: ['implementation', 'simple math'], link: '/contest/2022/s1' },
	{ name: '2022 S2 - Good Groups', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2022/s2' },
	{ name: '2022 S3 - Good Samples', difficulty: 'Insane', tags: ['ad hoc', 'constructive', 'greedy algorithms'], link: '/contest/2022/s3' },
	{ name: '2022 S4 - Good Triplets', difficulty: 'Insane', tags: ['ad hoc', 'simple math'], link: '/contest/2022/s4' },
	{ name: '2022 S5 - Good Influencers', difficulty: 'Wicked', tags: ['dynamic programming', 'graph theory'], link: '/contest/2022/s5' },

	// 2021 Junior
	{ name: '2021 J1 - Boiling Water', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2021/j1' },
	{ name: '2021 J2 - Silent Auction', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2021/j2' },
	{ name: '2021 J3 - Secret Instructions', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2021/j3' },
	{ name: '2021 J4 - Arranging Books', difficulty: 'Normal', tags: ['greedy algorithms'], link: '/contest/2021/j4' },
	{ name: '2021 J5 - Modern Art', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2021/s2' },
	// 2021 Senior
	{ name: '2021 S1 - Crazy Fencing', difficulty: 'Normal', tags: ['simple math'], link: '/contest/2021/s1' },
	{ name: '2021 S2 - Modern Art', difficulty: 'Hard', tags: ['implementation'], link: '/contest/2021/s2' },
	{ name: '2021 S3 - Lunch Concert', difficulty: 'Insane', tags: ['data structures'], link: '/contest/2021/s3' },
	{ name: '2021 S4 - Daily Commute', difficulty: 'Insane', tags: ['graph theory'], link: '/contest/2021/s4' },
	{ name: '2021 S5 - Math Homework', difficulty: 'Insane', tags: ['data structures', 'intermediate math'], link: '/contest/2021/s5' },

	// 2020 Junior
	{ name: '2020 J1 - Dog Treats', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2020/j1' },
	{ name: '2020 J2 - Epidemiology', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2020/j2' },
	{ name: '2020 J3 - Art', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2020/j3' },
	{ name: '2020 J4 - Cyclic Shifts', difficulty: 'Normal', tags: ['string algorithms'], link: '/contest/2020/j4' },
	{ name: '2020 J5 - Escape Room', difficulty: 'Insane', tags: ['graph theory'], link: '/contest/2020/s2' },

	// 2020 Senior
	{ name: '2020 S1 - Surmising a Sprinter\'s Speed', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2020/s1' },
	{ name: '2020 S2 - Escape Room', difficulty: 'Insane', tags: ['graph theory'], link: '/contest/2020/s2' },
	{ name: '2020 S3 - Searching for Strings', difficulty: 'Insane', tags: ['data structures', 'string algorithms'], link: '/contest/2020/s3' },
	{ name: '2020 S4 - Swapping Seats', difficulty: 'Insane', tags: ['greedy algorithms'], link: '/contest/2020/s4' },
	{ name: '2020 S5 - Josh\'s Double Bacon Deluxe', difficulty: 'Wicked', tags: ['dynamic programming', 'intermediate math'], link: '/contest/2020/s5' },

	// 2019 Junior
	{ name: '2019 J1 - Winning Score', difficulty: 'Easy', tags: ['implementation', 'simple math'], link: '/contest/2019/j1' },
	{ name: '2019 J2 - Time to Decompress', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2019/j2' },
	{ name: '2019 J3 - Cold Compress', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2019/j3' },
	{ name: '2019 J4 - Flipper', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2019/s1' },
	{ name: '2019 J5 - Rule of Three', difficulty: 'Hard', tags: ['divide and conquer', 'recursion'], link: '/contest/2019/j5' },

	// 2019 Senior
	{ name: '2019 S1 - Flipper', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2019/s1' },
	{ name: '2019 S2 - Pretty Average Primes', difficulty: 'Easy', tags: ['simple math'], link: '/contest/2019/s2' },
	{ name: '2019 S3 - Arithmetic Square', difficulty: 'Normal', tags: ['constructive', 'implementation'], link: '/contest/2019/s3' },
	{ name: '2019 S4 - Tourism', difficulty: 'Wicked', tags: ['dynamic programming'], link: '/contest/2019/s4' },
	{ name: '2019 S5 - Triangle: The Data Structure', difficulty: 'Hard', tags: ['data structures'], link: '/contest/2019/s5' },

	// 2018 Junior
	{ name: '2018 J1 - Telemarketer or not?', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2018/j1' },
	{ name: '2018 J2 - Occupy parking', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2018/j2' },
	{ name: '2018 J3 - Are we there yet?', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2018/j3' },
	{ name: '2018 J4 - Sunflowers', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2018/s2' },
	{ name: '2018 J5 - Choose your own path', difficulty: 'Normal', tags: ['graph theory'], link: '/contest/2018/j5' },

	// 2018 Senior
	{ name: '2018 S1 - Voronoi Villages', difficulty: 'Easy', tags: ['simple math'], link: '/contest/2018/s1' },
	{ name: '2018 S2 - Sunflowers', difficulty: 'Normal', tags: ['implementation'], link: '/contest/2018/s2' },
	{ name: '2018 S3 - RoboThieves', difficulty: 'Hard', tags: ['graph theory', 'implementation'], link: '/contest/2018/s3' },
	{ name: '2018 S4 - Balanced Trees', difficulty: 'Insane', tags: ['dynamic programming'], link: '/contest/2018/s4' },
	{ name: '2018 S5 - Maximum Strategic Savings', difficulty: 'Insane', tags: ['graph theory'], link: '/contest/2018/s5' },

	// 2017 Junior
	{ name: '2017 J1 - Quadrant Selection', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2017/j1' },
	{ name: '2017 J2 - Shifty Sum', difficulty: 'Easy', tags: ['simple math'], link: '/contest/2017/j2' },
	{ name: '2017 J3 - Exactly Electrical', difficulty: 'Hard', tags: ['simple math'], link: '/contest/2017/j3' },
	{ name: '2017 J4 - Favourite Times', difficulty: 'Normal', tags: ['simple math'], link: '/contest/2017/j4' },
	{ name: '2017 J5 - Nailed It!', difficulty: 'Hard', tags: ['simple math'], link: '/contest/2017/s3'},

	// 2017 Senior
	{ name: '2017 S1 - Sum Game', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2017/s1' },
	{ name: '2017 S2 - High Tide, Low Tide', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2017/s2' },
	{ name: '2017 S3 - Nailed It!', difficulty: 'Hard', tags: ['simple math'], link: '/contest/2017/s3' },
	{ name: '2017 S4 - Minimum Cost Flow', difficulty: 'Insane', tags: ['graph theory'], link: '/contest/2017/s4' },
	{ name: '2017 S5 - RMT', difficulty: 'Wicked', tags: ['data structures'], link: '/contest/2017/s5' },

	// 2016 Junior
	{ name: '2016 J1 - Tournament Selection', difficulty: 'Easy', tags: ['implementation'], link: '/contest/2016/j1' },
	{ name: '2016 J2 - Magic Squares', difficulty: 'Easy', tags: ['simple math'], link: '/contest/2016/j2' },
	{ name: '2016 J3 - Hidden Palindrome', difficulty: 'Normal', tags: ['string processing'], link: '/contest/2016/j3' },
	{ name: '2016 J4 - Arrival Time', difficulty: 'Normal', tags: ['strings', 'loops'], link: '/contest/2016/j4' },
	{ name: '2016 J5 - Tandem Bicycle', difficulty: 'Normal', tags: ['greedy'], link: '/contest/2016/s2' },

	// 2016 Senior
	{ name: '2016 S1 - Ragaman', difficulty: 'Easy', tags: ['decisions'], link: '/contest/2016/s1' },
	{ name: '2016 S2 - Tandem Bicycle', difficulty: 'Normal', tags: ['greedy'], link: '/contest/2016/s2' },
	{ name: '2016 S3 - Phonomenal Reviews', difficulty: 'Insane', tags: ['graph theory'], link: '/contest/2016/s3' },
	{ name: '2016 S4 - Combining Riceballs', difficulty: 'Insane', tags: ['interval dynamic programming'], link: '/contest/2016/s4' },
	{ name: '2016 S5 - Circle of Life', difficulty: 'Insane', tags: ['simulation', 'math'], link: '/contest/2016/s5' },

	// 2015 Junior
	{ name: '2015 J1 - Special Day', difficulty: 'Easy', tags: ['decisions'], link: '/contest/2015/j1' },
	{ name: '2015 J2 - Happy or Sad', difficulty: 'Easy', tags: ['strings', 'counting'], link: '/contest/2015/j2' },
	{ name: '2015 J3 - Rovarspraket', difficulty: 'Normal', tags: ['string processing'], link: '/contest/2015/j3' },
	{ name: '2015 J4 - Wait Time', difficulty: 'Normal', tags: ['array of records', 'sorting'], link: '/contest/2015/j4' },
	{ name: '2015 J5 - Pi-Day', difficulty: 'Hard', tags: ['recursion'], link: '/contest/2015/j5' },

	// 2015 Senior
	{ name: '2015 S1 - Zero That Out', difficulty: 'Easy', tags: ['stacks'], link: '/contest/2015/s1' },
	{ name: '2015 S2 - Jerseys', difficulty: 'Normal', tags: ['arrays'], link: '/contest/2015/s2' },
	{ name: '2015 S3 - Gates', difficulty: 'Hard', tags: ['disjoint sets', 'counting'], link: '/contest/2015/s3' },
	{ name: '2015 S4 - Convex Hull', difficulty: 'Insane', tags: ['shortest path', 'SPFA', 'Dijkstra'], link: '/contest/2015/s4' },
	{ name: '2015 S5 - Greedy for Pies', difficulty: 'Wicked', tags: ['dynamic programming', 'greedy'], link: '/contest/2015/s5' },

	// 2014 Junior
	{ name: '2014 J1 - Triangle Times', difficulty: 'Easy', tags: ['simple else-if'], link: '/contest/2014/j1' },
	{ name: '2014 J2 - Vote Count', difficulty: 'Easy', tags: ['loops', 'counting'], link: '/contest/2014/j2' },
	{ name: '2014 J3 - Double Dice', difficulty: 'Normal', tags: ['loops', 'counting'], link: '/contest/2014/j3' },
	{ name: '2014 J4 - Party Invitation', difficulty: 'Normal', tags: ['1D array'], link: '/contest/2014/s1' },
	{ name: '2014 J5 - Assigning Partners', difficulty: 'Hard', tags: ['arrays', 'sorting'], link: '/contest/2014/j5' },

	// 2014 Senior
	{ name: '2014 S1 - Party Invitation', difficulty: 'Normal', tags: ['1D array'], link: '/contest/2014/s1' },
	{ name: '2014 S2 - Assigning Partners', difficulty: 'Normal', tags: ['arrays', 'sorting'], link: '/contest/2014/s2' },
	{ name: '2014 S3 - The Geneva Confection', difficulty: 'Hard', tags: ['stacks'], link: '/contest/2014/s3' },
	{ name: '2014 S4 - Tinted Glass Window', difficulty: 'Insane', tags: ['sweep-line', 'difference arrays'], link: '/contest/2014/s4' },
	{ name: '2014 S5 - Lazy Fox', difficulty: 'Wicked', tags: ['dynamic programming', 'greedy'], link: '/contest/2014/s5' },

	// 2013 Junior
	{ name: '2013 J1 - Next in Line', difficulty: 'Easy', tags: ['simple calculation'], link: '/contest/2013/j1' },
	{ name: '2013 J2 - Rotating Letters', difficulty: 'Easy', tags: ['string processing'], link: '/contest/2013/j2' },
	{ name: '2013 J3 - From 1987 to 2013', difficulty: 'Normal', tags: ['digit processing'], link: '/contest/2013/s1' },
	{ name: '2013 J4 - Time on Task', difficulty: 'Normal', tags: ['sorting'], link: '/contest/2013/j4' },
	{ name: '2013 J5 - Chances of Winning', difficulty: 'Hard', tags: ['recursion', 'loops'], link: '/contest/2013/s3' },

	// 2013 Senior
	{ name: '2013 S1 - From 1987 to 2013', difficulty: 'Easy', tags: ['digit processing'], link: '/contest/2013/s1' },
	{ name: '2013 S2 - Bridge Transport', difficulty: 'Normal', tags: ['1D array processing'], link: '/contest/2013/s2' },
	{ name: '2013 S3 - Chances of Winning', difficulty: 'Hard', tags: ['recursion', 'brute force'], link: '/contest/2013/s3' },
	{ name: '2013 S4 - Who is Taller?', difficulty: 'Hard', tags: ['graph theory', 'BFS'], link: '/contest/2013/s4' },
	{ name: '2013 S5 - Factor Solitaire', difficulty: 'Insane', tags: ['dynamic programming'], link: '/contest/2013/s5' },

	// 2012 Junior
	{ name: '2012 J1 - Speed Fines Are Not Fine!', difficulty: 'Easy', tags: ['if statements'], link: '/contest/2012/j1' },
	{ name: '2012 J2 - Sounds Fishy!', difficulty: 'Easy', tags: ['if statements'], link: '/contest/2012/j2' },
	{ name: '2012 J3 - Icon Scaling', difficulty: 'Normal', tags: ['loops'], link: '/contest/2012/j3' },
	{ name: '2012 J4 - Big Bang Secrets', difficulty: 'Normal', tags: ['character manipulation'], link: '/contest/2012/j4' },
	{ name: '2012 J5 - A Coin Game', difficulty: 'Hard', tags: ['BFS', 'game tree'], link: '/contest/2012/s4' },

	// 2012 Senior
	{ name: '2012 S1 - Don\'t Pass Me the Ball!', difficulty: 'Easy', tags: ['combinatorics'], link: '/contest/2012/s1' },
	{ name: '2012 S2 - Aromatic Numbers', difficulty: 'Normal', tags: ['roman numerals'], link: '/contest/2012/s2' },
	{ name: '2012 S3 - Absolutely Acidic', difficulty: 'Normal', tags: ['arrays', 'sorting'], link: '/contest/2012/s3' },
	{ name: '2012 S4 - A Coin Game', difficulty: 'Insane', tags: ['BFS', 'game tree'], link: '/contest/2012/s4' },
	{ name: '2012 S5 - Mouse Journey', difficulty: 'Normal', tags: ['dynamic programming', '2D arrays'], link: '/contest/2012/s5' },

	// 2011 Junior
	{ name: '2011 J1 - Which Alien?', difficulty: 'Easy', tags: ['if statements'], link: '/contest/2011/j1' },
	{ name: '2011 J2 - Who Has Seen the Wind?', difficulty: 'Easy', tags: ['loops', 'if statements'], link: '/contest/2011/j2' },
	{ name: '2011 J3 - Sumac Sequences', difficulty: 'Normal', tags: ['loops'], link: '/contest/2011/j3' },
	{ name: '2011 J4 - Boring Business', difficulty: 'Normal', tags: ['2D arrays'], link: '/contest/2011/j4' },
	{ name: '2011 J5 - Unfriend', difficulty: 'Hard', tags: ['counting', 'recursion'], link: '/contest/2011/j5' },

	// 2011 Senior
	{ name: '2011 S1 - English or French?', difficulty: 'Easy', tags: ['character counting'], link: '/contest/2011/s1' },
	{ name: '2011 S2 - Multiple Choice', difficulty: 'Normal', tags: ['array processing'], link: '/contest/2011/s2' },
	{ name: '2011 S3 - Alice Through the Looking Glass', difficulty: 'Hard', tags: ['recursion'], link: '/contest/2011/s3' },
	{ name: '2011 S4 - Blood Distribution', difficulty: 'Insane', tags: ['array processing'], link: '/contest/2011/s4' },
	{ name: '2011 S5 - Switch', difficulty: 'Insane', tags: ['dynamic programming'], link: '/contest/2011/s5' },

	// 2010 Junior
	{ name: '2010 J1 - What is n, Daddy?', difficulty: 'Easy', tags: ["if statements", "calculation"], link: '/contest/2010/j1' },
	{ name: '2010 J2 - Up and Down', difficulty: 'Normal', tags: ["loops", "if statements"], link: '/contest/2010/j2' },
	{ name: '2010 J3 - Punchy', difficulty: 'Easy', tags: ["loop", "if statements"], link: '/contest/2010/j3' },
	{ name: '2010 J4 - Global Warming', difficulty: 'Hard', tags: ["arrays", "matching"], link: '/contest/2010/j4' },
	{ name: '2010 J5 - Knight Hop', difficulty: 'Hard', tags: ["2D arrays", "recursion", "BFS"], link: '/contest/2010/j5' },

	// 2010 Senior
	{ name: '2010 S1 - Computer Purchase', difficulty: 'Normal', tags: ["calculations", "if statements"], link: '/contest/2010/s1' },
	{ name: '2010 S2 - Huffman Encoding', difficulty: 'Normal', tags: ["arrays", "string handling"], link: '/contest/2010/s2' },
	{ name: '2010 S3 - Firehose', difficulty: 'Insane', tags: ["arrays", "linked lists", "binary search"], link: '/contest/2010/s3' },
	{ name: '2010 S4 - Animal Farm', difficulty: 'Insane', tags: ["2D arrays", "graph theory", "Prim\'s algorithm"], link: '/contest/2010/s4' },
	{ name: '2010 S5 - Nutrient Tree', difficulty: 'Wicked', tags: ["binary tree", "recursion", "arrays"], link: '/contest/2010/s5' },

	// 2009 Junior
	{ name: '2009 J1 - ISBN', difficulty: 'Easy', tags: ["arithmetic"], link: '/contest/2009/j1' },
	{ name: '2009 J2 - Old Fish\'s Hole', difficulty: 'Easy', tags: ["nested loops"], link: '/contest/2009/j2' },
	{ name: '2009 J3 - Good Times', difficulty: 'Normal', tags: ["calculations", "if statements"], link: '/contest/2009/j3' },
	{ name: '2009 J4 - Signage', difficulty: 'Normal', tags: ["string handling", "arrays"], link: '/contest/2009/j4' },
	{ name: '2009 J5 - Degrees of Separation', difficulty: 'Hard', tags: ["graph theory", "2D arrays"], link: '/contest/2009/j5' },

	// 2009 Senior
	{ name: '2009 S1 - Cool Numbers', difficulty: 'Hard', tags: ["loops", "calculations"], link: '/contest/2009/s1' },
	{ name: '2009 S2 - The Lights Go On and Off', difficulty: 'Hard', tags: ["array processing"], link: '/contest/2009/s2' },
	{ name: '2009 S3 - Degrees of Separation', difficulty: 'Hard', tags: ["graph theory", "2D arrays"], link: '/contest/2009/s3' },
	{ name: '2009 S4 - Ship and Shop', difficulty: 'Hard', tags: ["recursion", "Dijkstra's algorithm"], link: '/contest/2009/s4' },
	{ name: '2009 S5 - Wireless', difficulty: 'Insane', tags: ["2D array processing"], link: '/contest/2009/s5' },

	// 2008 Junior
	{ name: '2008 J1 - Body Mass Index', difficulty: 'Easy', tags: ["calculation"], link: '/contest/2008/j1' },
	{ name: '2008 J2 - Do the Shuffle', difficulty: 'Easy', tags: ["string handling"], link: '/contest/2008/j2' },
	{ name: '2008 J3 - GPS Text Entry', difficulty: 'Normal', tags: ["calculations", "if statements"], link: '/contest/2008/j3' },
	{ name: '2008 J4 - From Prefix to Postfix', difficulty: 'Hard', tags: ["recursion"], link: '/contest/2008/j4' },
	{ name: '2008 J5 - Nukit', difficulty: 'Hard', tags: ["recursion"], link: '/contest/2008/s5' },

	// 2008 Senior
	{ name: '2008 S1 - It\'s Cold Here', difficulty: 'Easy', tags: ["algorithm", "smallest element"], link: '/contest/2008/s1' },
	{ name: '2008 S2 - Pennies in the Ring', difficulty: 'Normal', tags: ["geometry"], link: '/contest/2008/s2' },
	{ name: '2008 S3 - Maze', difficulty: 'Hard', tags: ["recursion", "DFS", "BFS"], link: '/contest/2008/s3' },
	{ name: '2008 S4 - Twenty-four', difficulty: 'Hard', tags: ["nested loops", "2D arrays"], link: '/contest/2008/s4' },
	{ name: '2008 S5 - Nukit', difficulty: 'Hard', tags: ["recursion", "dynamic programming"], link: '/contest/2008/s5' },

	// 2007 Junior
	{ name: '2007 J1 - Who is in the Middle?', difficulty: 'Easy', tags: ["decisions"], link: '/contest/2007/j1' },
	{ name: '2007 J2 - I Speak TXTMSG', difficulty: 'Easy', tags: ["loops", "decisions"], link: '/contest/2007/j2' },
	{ name: '2007 J3 - Deal or No Deal Calculator', difficulty: 'Easy', tags: ["array processing"], link: '/contest/2007/j3' },
	{ name: '2007 J4 - Anagram Checker', difficulty: 'Normal', tags: ["string processing"], link: '/contest/2007/j4' },
	{ name: '2007 J5 - Keep on Truckin\'', difficulty: 'Hard', tags: ["dynamic programming", "recursion"], link: '/contest/2007/j5' },

	// 2007 Senior
	{ name: '2007 S1 - Federal Voting Age', difficulty: 'Easy', tags: ["decisions"], link: '/contest/2007/s1' },
	{ name: '2007 S2 - Boxes', difficulty: 'Normal', tags: ["arrays", "sorting"], link: '/contest/2007/s2' },
	{ name: '2007 S3 - Friends', difficulty: 'Hard', tags: ["arrays"], link: '/contest/2007/s3' },
	{ name: '2007 S4 - Water Park', difficulty: 'Hard', tags: ["linked lists", "recursion"], link: '/contest/2007/s4' },
	{ name: '2007 S5 - Bowling for Numbers', difficulty: 'Insane', tags: ["2D dynamic programming"], link: '/contest/2007/s5' },

	// 2006 Junior
	{ name: '2006 J1 - Canadian Calorie Counting', difficulty: 'Easy', tags: ["decisions"], link: '/contest/2006/j1' },
	{ name: '2006 J2 - Roll the Dice', difficulty: 'Easy', tags: ["loops", "counting"], link: '/contest/2006/j2' },
	{ name: '2006 J3 - Cell-Phone Messaging', difficulty: 'Easy', tags: ["strings", "decisions"], link: '/contest/2006/j3' },
	{ name: '2006 J4 - Tough Being a Teen', difficulty: 'Normal', tags: ["array handling"], link: '/contest/2006/j4' },
	{ name: '2006 J5 - CCC Othello', difficulty: 'Normal', tags: ["2D arrays"], link: '/contest/2006/j5' },

	// 2006 Senior
	{ name: '2006 S1 - Maternity', difficulty: 'Easy', tags: ["string handling"], link: '/contest/2006/s1' },
	{ name: '2006 S2 - Cipher Texts', difficulty: 'Normal', tags: ["string handling"], link: '/contest/2006/s2' },
	{ name: '2006 S3 - Tin Can Telephone', difficulty: 'Hard', tags: ["geometry", "vectors"], link: '/contest/2006/s3' },
	{ name: '2006 S4 - Groups', difficulty: 'Hard', tags: ["2D arrays"], link: '/contest/2006/s4' },
	{ name: '2006 S5 - Origin of Life', difficulty: 'Insane', tags: ["2D arrays", "queues", "algorithms"], link: '/contest/2006/s5' },

	// 2005 Junior
	{ name: '2005 J1 - Cell Sell', difficulty: 'Easy', tags: ['arithmetic', 'decision structures'], link: '/contest/2005/j1' },
	{ name: '2005 J2 - RSA Numbers', difficulty: 'Easy', tags: ['arithmetic', 'nested structures'], link: '/contest/2005/j2' },
	{ name: '2005 J3 - Returning Home', difficulty: 'Easy', tags: ['array processing', 'string processing'], link: '/contest/2005/j3' },
	{ name: '2005 J4 - Cross Spiral', difficulty: 'Hard', tags: ['2D array'], link: '/contest/2005/j4' },
	{ name: '2005 J5 - Bananas', difficulty: 'Hard', tags: ['recursion', 'iteration'], link: '/contest/2005/j5' },

	// 2005 Senior
	{ name: '2005 S1 - Snow Calls', difficulty: 'Easy', tags: ['string handling'], link: '/contest/2005/s1' },
	{ name: '2005 S2 - Mouse Move', difficulty: 'Easy', tags: ['basic structures'], link: '/contest/2005/s2' },
	{ name: '2005 S3 - Quantum Operations', difficulty: 'Normal', tags: ['2D array manipulation'], link: '/contest/2005/s3' },
	{ name: '2005 S4 - Pyramid Message Scheme', difficulty: 'Hard', tags: ['tree height', '1D array manipulation'], link: '/contest/2005/s4' },
	{ name: '2005 S5 - Pinball Ranking', difficulty: 'Hard', tags: ['sorting', 'binary search tree', 'merge sort'], link: '/contest/2005/s5' },

	// 2004 Junior
	{ name: '2004 J1 - Squares', difficulty: 'Easy', tags: ['reals', 'integers'], link: '/contest/2004/j1' },
	{ name: '2004 J2 - Terms of Office', difficulty: 'Easy', tags: ['simple arithmetic', 'loops', 'modulus'], link: '/contest/2004/j2' },
	{ name: '2004 J3 - Smile with Similes', difficulty: 'Easy', tags: ['nesting loops'], link: '/contest/2004/j3' },
	{ name: '2004 J4 - Simple Encryption', difficulty: 'Normal', tags: ['strings', 'character manipulation'], link: '/contest/2004/j4' },
	{ name: '2004 J5 - Fractals', difficulty: 'Hard', tags: ['geometry', 'array processing'], link: '/contest/2004/j5' },

	// 2004 Senior
	{ name: '2004 S1 - Fix', difficulty: 'Normal', tags: ['decisions', 'built-in string functions'], link: '/contest/2004/s1' },
	{ name: '2004 S2 - Top Yodeller', difficulty: 'Normal', tags: ['1D array processing'], link: '/contest/2004/s2' },
	{ name: '2004 S3 - Spreadsheet', difficulty: 'Hard', tags: ['2D arrays', 'string processing'], link: '/contest/2004/s3' },
	{ name: '2004 S4 - Space Turtle', difficulty: 'Hard', tags: ['geometry'], link: '/contest/2004/s4' },
	{ name: '2004 S5 - Super Plumber', difficulty: 'Insane', tags: ['2D arrays', 'dynamic programming'], link: '/contest/2004/s5' },

	// 2003 Junior
	{ name: '2003 J1 - Trident', difficulty: 'Easy', tags: ['character graphics'], link: '/contest/2003/j1' },
	{ name: '2003 J2 - Perfect Picture', difficulty: 'Easy', tags: ['simple arithmetic', 'div', 'mod'], link: '/contest/2003/j2' },
	{ name: '2003 J3 - Snakes and Ladders', difficulty: 'Easy', tags: ['counting', 'decisions'], link: '/contest/2003/s1' },
	{ name: '2003 J4 - Poetry', difficulty: 'Normal', tags: ['strings', 'decisions'], link: '/contest/2003/j4' },
	{ name: '2003 J5 - Floor Plan', difficulty: 'Hard', tags: ['2D array', 'recursion'], link: '/contest/2003/j5' },

	// 2003 Senior
	{ name: '2003 S1 - Snakes and Ladders', difficulty: 'Easy', tags: ['counting', 'decisions'], link: '/contest/2003/s1' },
	{ name: '2003 S2 - Poetry', difficulty: 'Normal', tags: ['strings', 'decisions'], link: '/contest/2003/s2' },
	{ name: '2003 S3 - Floor Plan', difficulty: 'Hard', tags: ['2D array', 'recursion'], link: '/contest/2003/s3' },
	{ name: '2003 S4 - Substrings', difficulty: 'Hard', tags: ['strings'], link: '/contest/2003/s4' },
	{ name: '2003 S5 - Trucking', difficulty: 'Insane', tags: ['graph theory', 'Prim\'s algorithm'], link: '/contest/2003/s5' },

	// 2002 Junior
	{ name: '2002 J1 - 0123456789', difficulty: 'Easy', tags: ['character graphics'], link: '/contest/2002/j1' },
	{ name: '2002 J2 - AmeriCanadian', difficulty: 'Easy', tags: ['simple strings'], link: '/contest/2002/j2' },
	{ name: '2002 J3 - Student Council\'s Breakfast', difficulty: 'Easy', tags: ['nested loops'], link: '/contest/2002/s1' },
	{ name: '2002 J4 - Fraction Action', difficulty: 'Easy', tags: ['GCD algorithm'], link: '/contest/2002/s2' },
	{ name: '2002 J5 - Blindfold', difficulty: 'Normal', tags: ['1D array', '2D array'], link: '/contest/2002/s3' },

	// 2002 Senior
	{ name: '2002 S1 - Student Council\'s Breakfast', difficulty: 'Easy', tags: ['nested loops'], link: '/contest/2002/s1' },
	{ name: '2002 S2 - Fraction Action', difficulty: 'Easy', tags: ['GCD algorithm'], link: '/contest/2002/s2' },
	{ name: '2002 S3 - Blindfold', difficulty: 'Normal', tags: ['1D array', '2D array'], link: '/contest/2002/s3' },
	{ name: '2002 S4 - Bridge Crossing', difficulty: 'Insane', tags: ['dynamic programming'], link: '/contest/2002/s4' },
	{ name: '2002 S5 - Bouncing Ball', difficulty: 'Insane', tags: ['geometry'], link: '/contest/2002/s5' },

	// 2001 Junior
	{ name: '2001 J1 - Dressing Up', difficulty: 'Easy', tags: ['character graphics'], link: '/contest/2001/j1' },
	{ name: '2001 J2 - Mod Inverse', difficulty: 'Easy', tags: ['simple arithmetic', 'div', 'mod'], link: '/contest/2001/j2' },
	{ name: '2001 J3 - Keeping Score', difficulty: 'Easy', tags: ['strings', 'decisions'], link: '/contest/2001/j3' },
	{ name: '2001 J4 - Spirals', difficulty: 'Normal', tags: ['loops', 'decisions'], link: '/contest/2001/j4' },
	{ name: '2001 J5 - Strategic Bombing', difficulty: 'Hard', tags: ['graph theory', 'Warshall\'s algorithm'], link: '/contest/2001/j5' },

	// 2001 Senior
	{ name: '2001 S1 - Keeping Score', difficulty: 'Easy', tags: ['strings', 'decisions'], link: '/contest/2001/s1' },
	{ name: '2001 S2 - Spirals', difficulty: 'Normal', tags: ['loops', 'decisions'], link: '/contest/2001/s2' },
	{ name: '2001 S3 - Strategic Bombing', difficulty: 'Hard', tags: ['graph theory', 'Warshall\'s algorithm'], link: '/contest/2001/s3' },
	{ name: '2001 S4 - Cookies', difficulty: 'Insane', tags: ['geometry'], link: '/contest/2001/s4' },
	{ name: '2001 S5 - Post\'s Correspondence', difficulty: 'Insane', tags: ['strings', 'recursion'], link: '/contest/2001/s5' },

	// 2000 Junior
	{ name: '2000 J1 - Calendar', difficulty: 'Easy', tags: ['loops', 'decisions'], link: '/contest/2000/j1' },
	{ name: '2000 J2 - 9966', difficulty: 'Easy', tags: ['arithmetic', 'decisions'], link: '/contest/2000/j2' },
	{ name: '2000 J3 - Slot Machines', difficulty: 'Easy', tags: ['loops', 'decisions'], link: '/contest/2000/s1' },
	{ name: '2000 J4 - Babbling Brooks', difficulty: 'Normal', tags: ['1D array manipulation'], link: '/contest/2000/s2' },
	{ name: '2000 J5 - Surfing', difficulty: 'Hard', tags: ['graph theory', 'Warshall\'s algorithm', 'BFS'], link: '/contest/2000/s3' },

	// 2000 Senior
	{ name: '2000 S1 - Slot Machines', difficulty: 'Easy', tags: ['loops', 'decisions'], link: '/contest/2000/s1' },
	{ name: '2000 S2 - Babbling Brooks', difficulty: 'Normal', tags: ['1D array manipulation'], link: '/contest/2000/s2' },
	{ name: '2000 S3 - Surfing', difficulty: 'Hard', tags: ['graph theory', 'Warshall\'s algorithm', 'BFS'], link: '/contest/2000/s3' },
	{ name: '2000 S4 - Golf', difficulty: 'Hard', tags: ['dynamic programming', 'BFS'], link: '/contest/2000/s4' },
	{ name: '2000 S5 - Sheep and Coyotes', difficulty: 'Insane', tags: ['geometry', '1D arrays'], link: '/contest/2000/s5' },
];

const HeroSection = ({ onSearch }) => {
  return (
    <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-16 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4">CCC Solutions</h1>
        <p className="text-2xl">Find all solutions to Canadian Computing Competition problems</p>
        <div className="flex justify-center text-justify text-black">
          <SearchBar problems={problems} />
        </div>
      </div>
    </div>
  );
};

const Solutions = () => {
  return (
    <div>
		<HeroSection />
		<ProblemsTable problems={problems} />
    </div>
  );
};

export default Solutions;