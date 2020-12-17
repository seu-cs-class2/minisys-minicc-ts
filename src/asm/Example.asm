.DATA	0x0
.TEXT	0x0
_label_0_main_entry:
	addi	$t0, $zero, 10
	addi	$at, $zero, 0
	sw	$t0, 1023($at)
	addi	$at, $zero, 0
	lw	$t0, 1023($at)
	or	$t0, $zero, $t1
	addi	$at, $zero, 4
	sw	$t1, 1023($at)
	addi	$t0, $zero, 20
	addi	$at, $zero, 8
	sw	$t0, 1023($at)
	addi	$at, $zero, 8
	lw	$t0, 1023($at)
	or	$t0, $zero, $t1
	addi	$at, $zero, 12
	sw	$t1, 1023($at)
	addi	$at, $zero, 4
	lw	$t0, 1023($at)
	addi	$at, $zero, 12
	lw	$t1, 1023($at)
	sub	$t0, $t1, $t2
	addi	$at, $zero, 16
	sw	$t2, 1023($at)
	addi	$at, $zero, 16
	lw	$t0, 1023($at)
	or	$t0, $zero, $t1
	addi	$at, $zero, 12
	sw	$t1, 1023($at)
	addi	$at, $zero, 4
	lw	$t0, 1023($at)
	addi	$at, $zero, 12
	lw	$t1, 1023($at)
	slt	$t1, $t0, $t2
	addi	$at, $zero, 20
	sw	$t2, 1023($at)
_label_2_true:
	addi	$at, $zero, 20
	lw	$t0, 1023($at)
	beq	$t0, $zero, _label_3_false
	nop
	addi	$at, $zero, 4
	lw	$t0, 1023($at)
	addi	$at, $zero, 12
	lw	$t1, 1023($at)
	div	$t0, $t1
	mflo	$t2
	addi	$at, $zero, 24
	sw	$t2, 1023($at)
	addi	$at, $zero, 4
	lw	$t0, 1023($at)
	addi	$at, $zero, 12
	lw	$t1, 1023($at)
	div	$t0, $t1
	mfhi	$t2
	addi	$at, $zero, 24
	sw	$t2, 1023($at)
	addi	$t0, $zero, 20
	addi	$at, $zero, 28
	sw	$t0, 1023($at)
	addi	$at, $zero, 24
	lw	$t0, 1023($at)
	addi	$at, $zero, 28
	lw	$t1, 1023($at)
	sub	$t0, $t1, $t2
	addi	$at, $zero, 32
	sw	$t2, 1023($at)
	addi	$at, $zero, 32
	lw	$t0, 1023($at)
	or	$t0, $zero, $t1
	addi	$at, $zero, 4
	sw	$t1, 1023($at)
_label_3_false:
_label_1_main_exit: