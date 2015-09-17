describe "Syntax - Literals" do


	test "hashes with dynamic keys" do
		var key = "b"
		var obj = a: 1, "{key}": 2, c: 3
		eq obj:a, 1
		eq obj:b, 2
		eq obj:c, 3

	test "regex with interpolation" do
		var str = "hey"
		var reg = /// #{str} ///
		eq reg.test("hey"), true
