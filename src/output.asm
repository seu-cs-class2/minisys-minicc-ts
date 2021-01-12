.data
a:	.word 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0
.text
main:			# vars = 0, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -0
	addiu	$t0, $zero, 5
	addiu	$t1, $zero, 2
	move	$v1, $t0
	sll	$v1, $v1, 2
	sw	$t1, a($v1)
	addiu	$t2, $zero, 0
	move	$v0, $t2
	addiu	$sp, $sp, 0
	jr	$ra
	nop